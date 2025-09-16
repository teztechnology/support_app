"use client";

import { Issue } from "@/types";

interface PriorityReportProps {
  issues: Issue[];
}

export function PriorityReport({ issues }: PriorityReportProps) {
  const priorities = ["critical", "high", "medium", "low"] as const;

  const priorityData = priorities.map((priority) => {
    const priorityIssues = issues.filter((i) => i.priority === priority);
    const openIssues = priorityIssues.filter(
      (i) => !["resolved", "closed"].includes(i.status)
    );
    const resolvedIssues = priorityIssues.filter(
      (i) => i.status === "resolved"
    );

    // Calculate average resolution time
    const resolvedWithTime = resolvedIssues.filter(
      (i) => i.resolvedAt && i.createdAt
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

    // Calculate aging for open issues
    const now = new Date().getTime();
    const averageAge =
      openIssues.length > 0
        ? openIssues.reduce((acc, issue) => {
            const created = new Date(issue.createdAt).getTime();
            return acc + (now - created);
          }, 0) /
          openIssues.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0;

    return {
      priority,
      totalIssues: priorityIssues.length,
      openIssues: openIssues.length,
      resolvedIssues: resolvedIssues.length,
      averageResolutionTime: averageResolutionTime,
      averageAge: averageAge,
      resolutionRate:
        priorityIssues.length > 0
          ? (resolvedIssues.length / priorityIssues.length) * 100
          : 0,
    };
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-900 bg-red-100 border-red-300";
      case "high":
        return "text-orange-900 bg-orange-100 border-orange-300";
      case "medium":
        return "text-yellow-900 bg-yellow-100 border-yellow-300";
      case "low":
        return "text-green-900 bg-green-100 border-green-300";
      default:
        return "text-gray-900 bg-gray-100 border-gray-300";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // SLA recommendations based on priority
  const slaRecommendations = {
    critical: { response: 1, resolution: 4 }, // 1 hour response, 4 hours resolution
    high: { response: 4, resolution: 24 }, // 4 hours response, 24 hours resolution
    medium: { response: 8, resolution: 72 }, // 8 hours response, 72 hours resolution
    low: { response: 24, resolution: 168 }, // 24 hours response, 168 hours resolution
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Issues by Priority
      </h2>

      {/* Priority Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {priorityData.map((data) => (
          <div
            key={data.priority}
            className={`rounded-lg border p-6 ${getPriorityColor(data.priority)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {data.priority}
                </h3>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{data.openIssues}</div>
                  <div className="text-sm">Open Issues</div>
                </div>
              </div>
              <div
                className={`h-12 w-12 rounded-full ${getPriorityBadgeColor(data.priority)}`}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{data.totalIssues}</div>
                <div>Total</div>
              </div>
              <div>
                <div className="font-medium">
                  {data.resolutionRate.toFixed(0)}%
                </div>
                <div>Resolved</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Priority Table */}
      <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Open Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Avg Age (Days)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Avg Resolution Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                SLA Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {priorityData.map((data) => {
              const sla =
                slaRecommendations[
                  data.priority as keyof typeof slaRecommendations
                ];
              const isOverSLA = data.averageAge > sla.resolution / 24; // Convert hours to days

              return (
                <tr
                  key={data.priority}
                  className={
                    data.priority === "critical" && data.openIssues > 0
                      ? "bg-red-50"
                      : ""
                  }
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`h-3 w-3 rounded-full ${getPriorityBadgeColor(data.priority)} mr-3`}
                      />
                      <span className="text-sm font-medium capitalize text-gray-900">
                        {data.priority}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {data.totalIssues}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {data.openIssues}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {data.openIssues > 0 ? data.averageAge.toFixed(1) : "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {data.averageResolutionTime > 0
                      ? `${data.averageResolutionTime.toFixed(1)}h`
                      : "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {data.openIssues > 0 ? (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          isOverSLA
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {isOverSLA ? "Over SLA" : "Within SLA"}
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SLA Guidelines */}
      <div className="mb-8 rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Recommended SLA Guidelines
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(slaRecommendations).map(([priority, sla]) => (
            <div key={priority} className="rounded-lg bg-white p-4">
              <div className="mb-2 flex items-center">
                <div
                  className={`h-3 w-3 rounded-full ${getPriorityBadgeColor(priority)} mr-2`}
                />
                <span className="font-medium capitalize">{priority}</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Response: {sla.response}h</div>
                <div>Resolution: {sla.resolution}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Alerts */}
      {priorityData.some(
        (p) => p.priority === "critical" && p.openIssues > 0
      ) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <div className="text-red-500">🚨</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Critical Issues Alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                There are{" "}
                {
                  priorityData.find((p) => p.priority === "critical")
                    ?.openIssues
                }{" "}
                open critical issues requiring immediate attention.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
