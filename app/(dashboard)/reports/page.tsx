import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

async function getReportsData(organizationId: string) {
  try {
    const [issues, customers, applications, categories] = await Promise.all([
      dbQueries.getIssues(organizationId),
      dbQueries.getCustomers(organizationId),
      dbQueries.getApplications(organizationId),
      dbQueries.getCategories(organizationId),
    ]);
    return { issues, customers, applications, categories };
  } catch (error) {
    console.error("Failed to fetch reports data:", error);
    return {
      issues: [],
      customers: [],
      applications: [],
      categories: [],
    };
  }
}

export default async function ReportsPage() {
  const session = await SessionManager.requirePermission("issues:read");
  const { issues, customers, applications, categories } = await getReportsData(
    session.organizationId
  );

  return (
    <ReportsClient
      issues={issues}
      customers={customers}
      applications={applications}
      categories={categories}
    />
  );
}
