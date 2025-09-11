"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStytchB2BClient } from "@stytch/nextjs/b2b";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { handleStytchCallback } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stytch = useStytchB2BClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordMode, setIsPasswordMode] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get("stytch_token_type");
      const stytchToken = searchParams.get("token");
      const orgId = searchParams.get("stytch_organization_id");

      if (token && stytchToken) {
        try {
          const result = await handleStytchCallback(
            stytchToken,
            orgId || undefined
          );
          if (result.success) {
            const redirect = searchParams.get("redirect") || "/dashboard";
            router.push(redirect);
          } else {
            console.error("Authentication failed:", result.error);
          }
        } catch (error) {
          console.error("Authentication error:", error);
        }
      }
    };

    handleAuth();
  }, [searchParams, router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const organizationId = process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!;
      const sessionDurationMinutes = parseInt(
        process.env.NEXT_PUBLIC_STYTCH_BUSINESS_SESSION_DURATION!
      );

      await stytch.passwords.authenticate({
        email_address: email,
        password: password,
        organization_id: organizationId,
        session_duration_minutes: sessionDurationMinutes,
      });

      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setError(
        err?.error_message ||
          "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const organizationId = process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!;
      const redirectUrl = `${window.location.origin}/login`;

      await stytch.magicLinks.email.loginOrSignup({
        email_address: email,
        organization_id: organizationId,
        login_redirect_url: redirectUrl,
        signup_redirect_url: redirectUrl,
      });

      setError("Check your email for a magic link!");
    } catch (err: any) {
      setError(
        err?.error_message || "Failed to send magic link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Support Ticket System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your organization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Use your organization email to access the support system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={
                isPasswordMode ? handlePasswordLogin : handleMagicLinkLogin
              }
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>

                {isPasswordMode && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                      required
                    />
                  </div>
                )}

                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? "Loading..."
                    : isPasswordMode
                      ? "Sign In"
                      : "Send Magic Link"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsPasswordMode(!isPasswordMode);
                    setError(null);
                    setPassword("");
                  }}
                >
                  {isPasswordMode
                    ? "Use magic link instead"
                    : "Use password instead"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
