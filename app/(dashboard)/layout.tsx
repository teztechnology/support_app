import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getStytchB2BServerClient } from "@/lib/stytch/server-client";
import { Navigation } from "@/components/navigation";

async function checkAuth() {
  try {
    const cookieStore = cookies();

    // Try both possible JWT tokens
    let jwtToken = cookieStore.get("stytch_session_jwt")?.value;
    if (!jwtToken) {
      jwtToken = cookieStore.get("tzv_b2b_token")?.value;
    }

    if (!jwtToken) {
      console.log("No JWT token found in cookies");
      return null;
    }

    console.log(
      "Attempting JWT authentication with token length:",
      jwtToken.length
    );

    // Use JWT authentication like the working example
    const client = getStytchB2BServerClient();
    const response = await client.sessions.authenticateJwt({
      session_jwt: jwtToken,
    });

    if (!response.member_session || !response.member_session.member_id) {
      console.log("No member_session or member_id in JWT response");
      return null;
    }

    const memberId = response.member_session.member_id;
    const organizationId = process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!;

    // Get member details using a fresh client instance to avoid body consumption issues
    let memberDetails = null;
    let organizationDetails = null;
    try {
      // Create a fresh client instance for member details
      const freshClient = getStytchB2BServerClient();
      const memberResponse = await freshClient.organizations.members.get({
        organization_id: organizationId,
        member_id: memberId,
      });
      memberDetails = memberResponse.member;

      // Get organization details too
      const orgResponse = await freshClient.organizations.get({
        organization_id: organizationId,
      });
      organizationDetails = orgResponse.organization;
    } catch (error) {
      console.log("Could not get member/org details, using fallback:", error);
    }

    console.log(
      "Authentication successful for member:",
      memberDetails?.name || memberDetails?.email_address || memberId
    );

    // Return session object with all available data
    return {
      userId: memberId,
      organizationId: organizationId,
      organizationName:
        organizationDetails?.organization_name || "Support Organization",
      userName: memberDetails?.name || memberDetails?.email_address || memberId,
      userEmail: memberDetails?.email_address || "",
      userRole: "admin", // Default role for now
      permissions: [
        "issues:read",
        "issues:write",
        "customers:read",
        "customers:write",
        "settings:read",
        "settings:write",
      ],
      stytchSessionId: response.member_session.member_session_id,
      stytchMemberId: memberId,
      expiresAt: response.member_session.expires_at,
    };
  } catch (error) {
    console.error("Auth check failed with error:", error);
    // Check if it's an expired token error
    if (error && typeof error === "object" && "error_type" in error) {
      console.error("Stytch error type:", (error as any).error_type);
      if ("error_message" in error) {
        console.error("Stytch error message:", (error as any).error_message);
      }
    }
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await checkAuth();

  // Redirect to login if authentication failed
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Support Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.userName} ({session.organizationName})
              </span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <aside className="w-64 rounded-lg bg-white p-6 shadow">
            <Navigation userRole={session.userRole} />
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
