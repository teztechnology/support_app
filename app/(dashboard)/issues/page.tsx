import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { Issue, Customer, Category, Application, User } from "@/types";
import { IssuesClient } from "./issues-client";

export const dynamic = "force-dynamic";

async function getPageData(organizationId: string) {
  try {
    const [issues, customers, categories, applications, users] =
      await Promise.all([
        dbQueries.getIssues(organizationId, {
          status: ["new", "in_progress", "awaiting_customer"],
        }),
        dbQueries.getCustomers(organizationId),
        dbQueries.getCategories(organizationId),
        dbQueries.getApplications(organizationId),
        dbQueries.getUsers(organizationId),
      ]);
    return { issues, customers, categories, applications, users };
  } catch (error) {
    console.error("Failed to fetch page data:", error);
    return {
      issues: [],
      customers: [],
      categories: [],
      applications: [],
      users: [],
    };
  }
}

export default async function IssuesPage() {
  const session = await SessionManager.requirePermission("issues:read");
  const { issues, customers, categories, applications, users } =
    await getPageData(session.organizationId);

  return (
    <IssuesClient
      initialIssues={issues}
      customers={customers}
      categories={categories}
      applications={applications}
      users={users}
    />
  );
}
