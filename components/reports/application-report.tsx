"use client";

import { Issue, Application } from "@/types";

interface ApplicationReportProps {
  issues: Issue[];
  applications: Application[];
}

export function ApplicationReport({
  issues,
  applications,
}: ApplicationReportProps) {
  const applicationData = applications
    .map((app) => {
      const appIssues = issues.filter((i) => i.applicationId === app.id);
      const openIssues = appIssues.filter(
        (i) => !["resolved", "closed"].includes(i.status)
      );
      const resolvedIssues = appIssues.filter((i) => i.status === "resolved");
      const criticalIssues = appIssues.filter(
        (i) =>
          i.priority === "critical" &&
          !["resolved", "closed"].includes(i.status)
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

      return {
        ...app,
        totalIssues: appIssues.length,
        openIssues: openIssues.length,
        resolvedIssues: resolvedIssues.length,
        criticalIssues: criticalIssues.length,
        averageResolutionTime: averageResolutionTime,
        resolutionRate:
          appIssues.length > 0
            ? (resolvedIssues.length / appIssues.length) * 100
            : 0,
      };
    })
    .sort((a, b) => b.totalIssues - a.totalIssues); // Sort by total issues descending

  // Issues without applications
  const unassignedIssues = issues.filter(
    (i) =>
      !i.applicationId || !applications.find((a) => a.id === i.applicationId)
  );

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Issues by Application
      </h2>

      {/* Summary */}
      <div className="mb-6 rounded-lg bg-blue-50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {applications.length}
            </div>
            <div className="text-sm text-blue-700">Total Applications</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {applicationData.filter((a) => a.totalIssues > 0).length}
            </div>
            <div className="text-sm text-blue-700">
              Applications with Issues
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {unassignedIssues.length}
            </div>
            <div className="text-sm text-blue-700">Unassigned Issues</div>
          </div>
        </div>
      </div>

      {/* Application Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Application
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Open Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Critical Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Resolution Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Avg Resolution Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {applicationData.map((app) => (
              <tr
                key={app.id}
                className={app.criticalIssues > 0 ? "bg-red-50" : ""}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {app.name}
                      </div>
                      {app.description && (
                        <div className="text-sm text-gray-500">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {app.totalIssues}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {app.openIssues}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {app.criticalIssues > 0 ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      {app.criticalIssues}
                    </span>
                  ) : (
                    <span className="text-gray-500">0</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {app.totalIssues > 0 ? (
                    <div className="flex items-center">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            app.resolutionRate >= 80
                              ? "bg-green-500"
                              : app.resolutionRate >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${app.resolutionRate}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs">
                        {app.resolutionRate.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {app.averageResolutionTime > 0
                    ? `${app.averageResolutionTime.toFixed(1)}h`
                    : "N/A"}
                </td>
              </tr>
            ))}

            {/* Unassigned Issues Row */}
            {unassignedIssues.length > 0 && (
              <tr className="bg-yellow-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    Unassigned
                  </div>
                  <div className="text-sm text-gray-500">
                    Issues without application assignment
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {unassignedIssues.length}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {
                    unassignedIssues.filter(
                      (i) => !["resolved", "closed"].includes(i.status)
                    ).length
                  }
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {
                    unassignedIssues.filter(
                      (i) =>
                        i.priority === "critical" &&
                        !["resolved", "closed"].includes(i.status)
                    ).length
                  }
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  N/A
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  N/A
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Issues by Application */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Applications Requiring Attention
        </h3>
        <div className="space-y-4">
          {applicationData
            .filter((app) => app.criticalIssues > 0 || app.resolutionRate < 60)
            .slice(0, 5)
            .map((app) => (
              <div
                key={app.id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{app.name}</h4>
                    <div className="mt-1 flex space-x-4 text-sm text-gray-600">
                      {app.criticalIssues > 0 && (
                        <span className="text-red-600">
                          ⚠️ {app.criticalIssues} critical issues
                        </span>
                      )}
                      {app.resolutionRate < 60 && (
                        <span className="text-orange-600">
                          📉 Low resolution rate (
                          {app.resolutionRate.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {app.openIssues} open issues
                    </div>
                    <div className="text-xs text-gray-500">
                      {app.totalIssues} total
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
