"use client";

import Link from "next/link";
import { Issue, Customer, Application, Category } from "@/types";

interface IssuesListProps {
  issues: Issue[];
  customers: Customer[];
  applications: Application[];
  categories: Category[];
  groupBy: "none" | keyof Issue | "category";
  sortBy: keyof Issue;
  sortOrder: "asc" | "desc";
  onSort: (field: keyof Issue, order: "asc" | "desc") => void;
}

export function IssuesList({
  issues,
  customers,
  applications,
  categories,
  groupBy,
  sortBy,
  sortOrder,
  onSort,
}: IssuesListProps) {
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || "Unknown";
  };

  const getApplicationName = (applicationId?: string) => {
    if (!applicationId) return "Unassigned";
    const application = applications.find((a) => a.id === applicationId);
    return application?.name || "Unknown";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getGroupName = (issue: Issue) => {
    switch (groupBy) {
      case "customerId":
        return getCustomerName(issue.customerId);
      case "applicationId":
        return getApplicationName(issue.applicationId);
      case "category":
        return getCategoryName(issue.category);
      case "priority":
        return issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1);
      case "status":
        return (
          issue.status.replace("_", " ").charAt(0).toUpperCase() +
          issue.status.replace("_", " ").slice(1)
        );
      default:
        return "Other";
    }
  };

  // Group issues (or create single group if no grouping)
  const groupedIssues =
    groupBy === "none"
      ? { "All Issues": issues }
      : issues.reduce(
          (groups, issue) => {
            const groupName = getGroupName(issue);
            if (!groups[groupName]) {
              groups[groupName] = [];
            }
            groups[groupName].push(issue);
            return groups;
          },
          {} as Record<string, Issue[]>
        );

  const handleSort = (field: keyof Issue) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };

  const getSortIcon = (field: keyof Issue) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "awaiting_customer":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Issues Report
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({issues.length} issues)
        </span>
      </h2>

      {Object.keys(groupedIssues).length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            No issues found in the selected date range.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIssues)
            .sort(([, a], [, b]) => b.length - a.length) // Sort groups by issue count
            .map(([groupName, groupIssues]) => (
              <div
                key={groupName}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                {/* Group Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {groupName}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({groupIssues.length} issue
                      {groupIssues.length !== 1 ? "s" : ""})
                    </span>
                  </h3>
                </div>

                {/* Issues Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                          onClick={() => handleSort("title")}
                        >
                          Issue {getSortIcon("title")}
                        </th>
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                          onClick={() => handleSort("status")}
                        >
                          Status {getSortIcon("status")}
                        </th>
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                          onClick={() => handleSort("priority")}
                        >
                          Priority {getSortIcon("priority")}
                        </th>
                        {groupBy !== "customerId" && (
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Customer
                          </th>
                        )}
                        {groupBy !== "applicationId" && (
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Application
                          </th>
                        )}
                        {groupBy !== "category" && (
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Category
                          </th>
                        )}
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                          onClick={() => handleSort("createdAt")}
                        >
                          Created {getSortIcon("createdAt")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {groupIssues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <Link
                              href={`/issues/${issue.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-900"
                            >
                              {issue.title}
                            </Link>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(issue.status)}`}
                            >
                              {issue.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeColor(issue.priority)}`}
                            >
                              {issue.priority}
                            </span>
                          </td>
                          {groupBy !== "customerId" && (
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {getCustomerName(issue.customerId)}
                            </td>
                          )}
                          {groupBy !== "applicationId" && (
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {getApplicationName(issue.applicationId)}
                            </td>
                          )}
                          {groupBy !== "category" && (
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {getCategoryName(issue.category)}
                            </td>
                          )}
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
