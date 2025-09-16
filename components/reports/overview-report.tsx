"use client";

import { Issue, Customer, Application } from "@/types";

interface OverviewReportProps {
  issues: Issue[];
  customers: Customer[];
  applications: Application[];
}

export function OverviewReport({
  issues,
  customers,
  applications,
}: OverviewReportProps) {
  const totalIssues = issues.length;
  const openIssues = issues.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  ).length;
  const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
  const criticalIssues = issues.filter(
    (i) =>
      i.priority === "critical" && !["resolved", "closed"].includes(i.status)
  ).length;

  // Calculate average resolution time
  const resolvedWithTime = issues.filter(
    (i) => i.resolvedAt && i.createdAt && i.status === "resolved"
  );
  const averageResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, issue) => {
          const created = new Date(issue.createdAt).getTime();
          const resolved = new Date(issue.resolvedAt!).getTime();
          return acc + (resolved - created);
        }, 0) /
        resolvedWithTime.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  // Issue trends by day
  const issueTrends = getIssueTrendsByDay(issues);

  // Status breakdown
  const statusBreakdown = [
    {
      status: "New",
      count: issues.filter((i) => i.status === "new").length,
      color: "bg-blue-500",
    },
    {
      status: "In Progress",
      count: issues.filter((i) => i.status === "in_progress").length,
      color: "bg-yellow-500",
    },
    {
      status: "Awaiting Customer",
      count: issues.filter((i) => i.status === "awaiting_customer").length,
      color: "bg-purple-500",
    },
    { status: "Resolved", count: resolvedIssues, color: "bg-green-500" },
  ];

  // Priority breakdown
  const priorityBreakdown = [
    {
      priority: "Critical",
      count: issues.filter((i) => i.priority === "critical").length,
      color: "bg-red-500",
    },
    {
      priority: "High",
      count: issues.filter((i) => i.priority === "high").length,
      color: "bg-orange-500",
    },
    {
      priority: "Medium",
      count: issues.filter((i) => i.priority === "medium").length,
      color: "bg-yellow-500",
    },
    {
      priority: "Low",
      count: issues.filter((i) => i.priority === "low").length,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Overview Report
      </h2>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Issues" value={totalIssues.toString()} />
        <MetricCard title="Open Issues" value={openIssues.toString()} />
        <MetricCard title="Resolved Issues" value={resolvedIssues.toString()} />
        <MetricCard
          title="Critical Issues"
          value={criticalIssues.toString()}
          highlight={criticalIssues > 0}
        />
      </div>

      {/* Resolution Time */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Resolution Metrics
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {averageResolutionTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">Average Resolution Time</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {resolvedWithTime.length}
            </div>
            <div className="text-sm text-gray-600">
              Issues with Resolution Time Data
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Issues by Status
        </h3>
        <div className="space-y-3">
          {statusBreakdown.map((item) => (
            <div key={item.status} className="flex items-center">
              <div className="w-32 text-sm text-gray-600">{item.status}</div>
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="h-4 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-4 rounded-full ${item.color}`}
                      style={{
                        width:
                          totalIssues > 0
                            ? `${(item.count / totalIssues) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Issues by Priority
        </h3>
        <div className="space-y-3">
          {priorityBreakdown.map((item) => (
            <div key={item.priority} className="flex items-center">
              <div className="w-32 text-sm text-gray-600">{item.priority}</div>
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="h-4 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-4 rounded-full ${item.color}`}
                      style={{
                        width:
                          totalIssues > 0
                            ? `${(item.count / totalIssues) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Trends */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Issue Creation Trend
        </h3>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="space-y-2">
            {issueTrends.slice(-7).map((trend) => (
              <div
                key={trend.date}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600">{trend.date}</span>
                <span className="text-sm font-medium">
                  {trend.count} issues
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-6 ${highlight ? "border border-red-200 bg-red-50" : "bg-gray-50"}`}
    >
      <div
        className={`text-2xl font-bold ${highlight ? "text-red-900" : "text-gray-900"}`}
      >
        {value}
      </div>
      <div
        className={`text-sm ${highlight ? "text-red-600" : "text-gray-600"}`}
      >
        {title}
      </div>
    </div>
  );
}

function getIssueTrendsByDay(issues: Issue[]) {
  const trends = issues.reduce(
    (acc, issue) => {
      const date = new Date(issue.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(trends)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
