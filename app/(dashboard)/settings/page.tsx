import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { Category, Application, User } from "@/types";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

async function getSettingsData(
  organizationId: string,
  stytchOrganizationId: string
) {
  try {
    const [categories, applications, databaseUsers] = await Promise.all([
      dbQueries.getCategories(organizationId),
      dbQueries.getApplications(organizationId),
      dbQueries.getUsers(organizationId),
    ]);
    return { categories, applications, databaseUsers };
  } catch (error) {
    console.error("Failed to fetch settings data:", error);
    return { categories: [], applications: [], databaseUsers: [] };
  }
}

export default async function SettingsPage() {
  const session = await SessionManager.requirePermission("settings:read");

  const { categories, applications, databaseUsers } = await getSettingsData(
    session.organizationId,
    session.stytchOrganizationId
  );

  return (
    <SettingsClient
      categories={categories}
      applications={applications}
      databaseUsers={databaseUsers}
      userRole={session.userRole}
      stytchOrganizationId={session.stytchOrganizationId}
    />
  );
}
