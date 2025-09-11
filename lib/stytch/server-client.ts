// Server-side Stytch B2B client using Node.js SDK
// Note: Install 'stytch' package with: npm install stytch

interface StytchB2BServerResponse {
  status_code: number;
  session?: any;
  member?: any;
  organization?: any;
}

interface StytchSession {
  session_token: string;
  organization_id?: string;
}

// Placeholder types until stytch package is installed
type StytchB2BClient = {
  sessions: {
    authenticate: (params: any) => Promise<StytchB2BServerResponse>;
    authenticateJwt: (params: any) => Promise<any>;
    revoke: (params: any) => Promise<StytchB2BServerResponse>;
  };
  organizations: {
    get: (params: any) => Promise<StytchB2BServerResponse>;
    create: (params: any) => Promise<StytchB2BServerResponse>;
    members: {
      get: (params: any) => Promise<StytchB2BServerResponse>;
      create: (params: any) => Promise<StytchB2BServerResponse>;
      update: (params: any) => Promise<StytchB2BServerResponse>;
    };
  };
};

let stytchClient: StytchB2BClient | null = null;

function createMockClient(): StytchB2BClient {
  return {
    sessions: {
      authenticate: async () => ({ status_code: 500 }),
      authenticateJwt: async () => ({ status_code: 500 }),
      revoke: async () => ({ status_code: 500 }),
    },
    organizations: {
      get: async () => ({ status_code: 500 }),
      create: async () => ({ status_code: 500 }),
      members: {
        get: async () => ({ status_code: 500 }),
        create: async () => ({ status_code: 500 }),
        update: async () => ({ status_code: 500 }),
      },
    },
  };
}

export function getStytchB2BServerClient(): StytchB2BClient {
  if (!stytchClient) {
    const projectId =
      process.env.STYTCH_BUSINESS_PROJECT_ID || process.env.STYTCH_PROJECT_ID;
    const secret =
      process.env.STYTCH_BUSINESS_SECRET || process.env.STYTCH_SECRET;

    if (!projectId || !secret) {
      console.warn("Missing Stytch configuration. Using mock client.");
      return createMockClient();
    }

    try {
      // Try to load the actual Stytch client
      const stytch = require("stytch");
      stytchClient = new stytch.B2BClient({
        project_id: projectId,
        secret: secret,
      });
    } catch (error) {
      console.warn(
        "Stytch package not installed. Using mock client. Install with: npm install stytch"
      );
      return createMockClient();
    }
  }

  return stytchClient!;
}

export async function authenticateB2BSession(
  sessionToken: string,
  organizationId?: string
) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.sessions.authenticate({
      session_token: sessionToken,
      ...(organizationId && { organization_id: organizationId }),
    });
    return response;
  } catch (error) {
    console.error("Stytch B2B session authentication failed:", error);
    throw error;
  }
}

export async function getB2BOrganization(organizationId: string) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.organizations.get({
      organization_id: organizationId,
    });
    return response;
  } catch (error) {
    console.error("Failed to get B2B organization:", error);
    throw error;
  }
}

export async function getB2BMember(organizationId: string, memberId: string) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.organizations.members.get({
      organization_id: organizationId,
      member_id: memberId,
    });
    return response;
  } catch (error) {
    console.error("Failed to get B2B member:", error);
    throw error;
  }
}

export async function updateB2BMember(
  organizationId: string,
  memberId: string,
  updates: {
    name?: string;
    trusted_metadata?: Record<string, any>;
    untrusted_metadata?: Record<string, any>;
  }
) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.organizations.members.update({
      organization_id: organizationId,
      member_id: memberId,
      ...updates,
    });
    return response;
  } catch (error) {
    console.error("Failed to update B2B member:", error);
    throw error;
  }
}

export async function deleteB2BSession(sessionToken: string) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.sessions.revoke({
      session_token: sessionToken,
    });
    return response;
  } catch (error) {
    console.error("Failed to revoke B2B session:", error);
    throw error;
  }
}

export async function inviteB2BMember(
  organizationId: string,
  emailAddress: string,
  inviteRedirectUrl: string,
  name?: string
) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.organizations.members.create({
      organization_id: organizationId,
      email_address: emailAddress,
      name,
      invite_redirect_url: inviteRedirectUrl,
    });
    return response;
  } catch (error) {
    console.error("Failed to invite B2B member:", error);
    throw error;
  }
}

export async function createB2BOrganization(
  organizationName: string,
  organizationSlug: string,
  emailAddress: string,
  sessionDurationMinutes = 60 * 24 * 7 // 1 week default
) {
  try {
    const client = getStytchB2BServerClient();
    const response = await client.organizations.create({
      organization_name: organizationName,
      organization_slug: organizationSlug,
      email_address: emailAddress,
      session_duration_minutes: sessionDurationMinutes,
    });
    return response;
  } catch (error) {
    console.error("Failed to create B2B organization:", error);
    throw error;
  }
}
