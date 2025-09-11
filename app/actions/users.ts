"use server";

import { revalidatePath } from "next/cache";
import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { ServerActionResponse, User } from "@/types";

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case "admin":
      return [
        "issues:read",
        "issues:write",
        "issues:delete",
        "customers:read",
        "customers:write",
        "customers:delete",
        "settings:read",
        "settings:write",
      ];
    case "support_agent":
      return [
        "issues:read",
        "issues:write",
        "customers:read",
        "customers:write",
      ];
    case "read_only":
      return ["issues:read", "customers:read"];
    default:
      return [];
  }
}

export async function searchStytchMembers(
  emailQuery: string
): Promise<ServerActionResponse<any[]>> {
  try {
    const session = await SessionManager.requirePermission("settings:read");

    if (!emailQuery || emailQuery.length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    const searchResults = await SessionManager.searchOrganizationMembersByEmail(
      session.stytchOrganizationId!,
      emailQuery
    );

    return {
      success: true,
      data: searchResults,
    };
  } catch (error: any) {
    console.error("Search Stytch members error:", error);
    return {
      success: false,
      error: error.message || "Failed to search members",
    };
  }
}

export async function getOrganizationMembersWithStatus(): Promise<
  ServerActionResponse<{ stytchMembers: any[]; databaseUsers: User[] }>
> {
  try {
    const session = await SessionManager.requirePermission("settings:read");

    // Get both Stytch members and database users
    const [stytchMembers, databaseUsers] = await Promise.all([
      SessionManager.getOrganizationMembers(session.stytchOrganizationId!),
      dbQueries.getUsers(session.organizationId),
    ]);

    return {
      success: true,
      data: {
        stytchMembers,
        databaseUsers,
      },
    };
  } catch (error: any) {
    console.error("Get organization members error:", error);
    return {
      success: false,
      error: error.message || "Failed to get organization members",
    };
  }
}

export async function addUserToDatabase(
  stytchMemberId: string,
  role: string = "support_agent"
): Promise<ServerActionResponse<User>> {
  try {
    const session = await SessionManager.requirePermission("settings:write");

    // Get the Stytch member details
    const stytchMembers = await SessionManager.getOrganizationMembers(
      session.stytchOrganizationId!
    );
    const stytchMember = stytchMembers.find(
      (m) => m.member_id === stytchMemberId
    );

    if (!stytchMember) {
      return {
        success: false,
        error: "Stytch member not found",
      };
    }

    // Check if user already exists in database
    const existingUser =
      await dbQueries.getUserByStytchMemberId(stytchMemberId);
    if (existingUser) {
      return {
        success: false,
        error: "User already exists in database",
      };
    }

    // Create user directly with the organization ID we have
    const newUser: Omit<User, "id" | "createdAt" | "updatedAt"> = {
      name: stytchMember.name || stytchMember.email_address,
      email: stytchMember.email_address,
      role: role as any,
      organizationId: session.organizationId,
      stytchMemberId: stytchMemberId,
      permissions: getDefaultPermissions(role),
      isActive: true,
      lastLoginAt: undefined,
    };

    const createdUser = await dbQueries.createItem<User>(
      "users",
      {
        ...newUser,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    );

    revalidatePath("/settings");

    return {
      success: true,
      data: createdUser,
    };
  } catch (error: any) {
    console.error("Add user to database error:", error);
    return {
      success: false,
      error: error.message || "Failed to add user to database",
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: string,
  permissions: string[]
): Promise<ServerActionResponse<User>> {
  try {
    const session = await SessionManager.requirePermission("settings:write");

    const existingUser = await dbQueries.getUserById(
      userId,
      session.organizationId
    );
    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const updatedUser = await dbQueries.updateItem<User>(
      "users",
      userId,
      {
        ...existingUser,
        role: role as any,
        permissions,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    );

    revalidatePath("/settings");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error: any) {
    console.error("Update user role error:", error);
    return {
      success: false,
      error: error.message || "Failed to update user role",
    };
  }
}

export async function toggleUserActivation(
  userId: string
): Promise<ServerActionResponse<User>> {
  try {
    const session = await SessionManager.requirePermission("settings:write");

    const existingUser = await dbQueries.getUserById(
      userId,
      session.organizationId
    );
    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const updatedUser = await dbQueries.updateItem<User>(
      "users",
      userId,
      {
        ...existingUser,
        isActive: !existingUser.isActive,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    );

    revalidatePath("/settings");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error: any) {
    console.error("Toggle user activation error:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle user activation",
    };
  }
}

export async function removeUserFromDatabase(
  userId: string
): Promise<ServerActionResponse<void>> {
  try {
    const session = await SessionManager.requirePermission("settings:write");

    const existingUser = await dbQueries.getUserById(
      userId,
      session.organizationId
    );
    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    await dbQueries.deleteItem("users", userId, session.organizationId);

    revalidatePath("/settings");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Remove user from database error:", error);
    return {
      success: false,
      error: error.message || "Failed to remove user from database",
    };
  }
}
