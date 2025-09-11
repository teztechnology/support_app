"use client";

import { useState } from "react";
import { useStytchB2BClient } from "@stytch/nextjs/b2b";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const stytchB2BClient = useStytchB2BClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await stytchB2BClient.passwords.authenticate({
        organization_id: process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!,
        email_address: email,
        password: password,
        session_duration_minutes: 60 * 24 * 7, // 7 days
      });

      if (response.status_code === 200) {
        router.push("/");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await stytchB2BClient.magicLinks.email.loginOrSignup({
        organization_id: process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!,
        email_address: email,
      });

      if (response.status_code === 200) {
        setError("");
        // Show success message
        alert("Check your email for a magic link to sign in!");
      } else {
        setError("Failed to send magic link. Please try again.");
      }
    } catch (error) {
      console.error("Magic link error:", error);
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-medium text-gray-900">Sign In</h3>
      <p className="mb-6 text-sm text-gray-600">
        Use your organization email to access the support system
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <button
          onClick={handleMagicLink}
          disabled={isLoading || !email}
          className="mt-4 flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use magic link instead
        </button>
      </div>
    </div>
  );
}
