"use client";

import { Issue, Customer } from "@/types";

interface CustomerReportProps {
  issues: Issue[];
  customers: Customer[];
}

export function CustomerReport({ issues, customers }: CustomerReportProps) {
  const customerData = customers
    .map((customer) => {
      const customerIssues = issues.filter((i) => i.customerId === customer.id);
      const openIssues = customerIssues.filter(
        (i) => !["resolved", "closed"].includes(i.status)
      );
      const resolvedIssues = customerIssues.filter(
        (i) => i.status === "resolved"
      );
      const criticalIssues = customerIssues.filter(
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

      // Customer satisfaction score (mock calculation based on resolution time and critical issues)
      const satisfactionScore = calculateSatisfactionScore(customerIssues);

      return {
        ...customer,
        totalIssues: customerIssues.length,
        openIssues: openIssues.length,
        resolvedIssues: resolvedIssues.length,
        criticalIssues: criticalIssues.length,
        averageResolutionTime: averageResolutionTime,
        resolutionRate:
          customerIssues.length > 0
            ? (resolvedIssues.length / customerIssues.length) * 100
            : 0,
        satisfactionScore: satisfactionScore,
      };
    })
    .sort((a, b) => b.totalIssues - a.totalIssues); // Sort by total issues descending

  // Top customers by issue volume
  const topCustomers = customerData.slice(0, 5);

  // Customers needing attention (high critical issues or low satisfaction)
  const customersNeedingAttention = customerData.filter(
    (c) =>
      c.criticalIssues > 0 || c.satisfactionScore < 70 || c.resolutionRate < 60
  );

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Issues by Customer
      </h2>

      {/* Summary */}
      <div className="mb-6 rounded-lg bg-green-50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-2xl font-bold text-green-900">
              {customers.length}
            </div>
            <div className="text-sm text-green-700">Total Customers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">
              {customerData.filter((c) => c.totalIssues > 0).length}
            </div>
            <div className="text-sm text-green-700">Customers with Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">
              {customersNeedingAttention.length}
            </div>
            <div className="text-sm text-green-700">Need Attention</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">
              {(
                customerData.reduce((acc, c) => acc + c.satisfactionScore, 0) /
                Math.max(customerData.length, 1)
              ).toFixed(0)}
              %
            </div>
            <div className="text-sm text-green-700">Avg Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Top Customers by Issue Volume
        </h3>
        <div className="space-y-4">
          {topCustomers.map((customer, index) => (
            <div
              key={customer.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-900">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {customer.companyName}
                    </h4>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>{customer.totalIssues} total issues</span>
                      <span>{customer.openIssues} open</span>
                      {customer.criticalIssues > 0 && (
                        <span className="text-red-600">
                          ⚠️ {customer.criticalIssues} critical
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">
                      {customer.satisfactionScore.toFixed(0)}% satisfaction
                    </div>
                    <div
                      className={`h-2 w-16 rounded-full ${
                        customer.satisfactionScore >= 80
                          ? "bg-green-200"
                          : customer.satisfactionScore >= 60
                            ? "bg-yellow-200"
                            : "bg-red-200"
                      }`}
                    >
                      <div
                        className={`h-2 rounded-full ${
                          customer.satisfactionScore >= 80
                            ? "bg-green-500"
                            : customer.satisfactionScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${customer.satisfactionScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {customer.resolutionRate.toFixed(0)}% resolution rate
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Satisfaction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {customerData.map((customer) => (
              <tr
                key={customer.id}
                className={customer.criticalIssues > 0 ? "bg-red-50" : ""}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.companyName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {customer.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {customer.totalIssues}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {customer.openIssues}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {customer.criticalIssues > 0 ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      {customer.criticalIssues}
                    </span>
                  ) : (
                    <span className="text-gray-500">0</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {customer.totalIssues > 0 ? (
                    <div className="flex items-center">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            customer.resolutionRate >= 80
                              ? "bg-green-500"
                              : customer.resolutionRate >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${customer.resolutionRate}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs">
                        {customer.resolutionRate.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {customer.averageResolutionTime > 0
                    ? `${customer.averageResolutionTime.toFixed(1)}h`
                    : "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-12 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          customer.satisfactionScore >= 80
                            ? "bg-green-500"
                            : customer.satisfactionScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${customer.satisfactionScore}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs">
                      {customer.satisfactionScore.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customers Needing Attention */}
      {customersNeedingAttention.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Customers Requiring Attention
          </h3>
          <div className="space-y-3">
            {customersNeedingAttention.slice(0, 5).map((customer) => (
              <div key={customer.id} className="rounded-lg bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {customer.companyName}
                    </h4>
                    <div className="mt-1 flex space-x-4 text-sm text-gray-600">
                      {customer.criticalIssues > 0 && (
                        <span className="text-red-600">
                          ⚠️ {customer.criticalIssues} critical issues
                        </span>
                      )}
                      {customer.satisfactionScore < 70 && (
                        <span className="text-orange-600">
                          📉 Low satisfaction (
                          {customer.satisfactionScore.toFixed(0)}%)
                        </span>
                      )}
                      {customer.resolutionRate < 60 && (
                        <span className="text-orange-600">
                          🐌 Low resolution rate (
                          {customer.resolutionRate.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {customer.openIssues} open issues
                    </div>
                    <div className="text-xs text-gray-500">
                      {customer.totalIssues} total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function calculateSatisfactionScore(issues: Issue[]): number {
  if (issues.length === 0) return 100;

  let score = 100;

  // Reduce score based on critical issues
  const criticalIssues = issues.filter((i) => i.priority === "critical");
  score -= criticalIssues.length * 10;

  // Reduce score based on resolution time
  const resolvedIssues = issues.filter(
    (i) => i.status === "resolved" && i.resolvedAt && i.createdAt
  );
  if (resolvedIssues.length > 0) {
    const avgResolutionHours =
      resolvedIssues.reduce((acc, issue) => {
        const created = new Date(issue.createdAt).getTime();
        const resolved = new Date(issue.resolvedAt!).getTime();
        return acc + (resolved - created);
      }, 0) /
      resolvedIssues.length /
      (1000 * 60 * 60);

    // Deduct points for slow resolution (baseline: 24 hours)
    if (avgResolutionHours > 24) {
      score -= Math.min(20, ((avgResolutionHours - 24) / 24) * 10);
    }
  }

  // Reduce score for unresolved issues
  const openIssues = issues.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );
  score -= openIssues.length * 5;

  return Math.max(0, Math.min(100, score));
}
