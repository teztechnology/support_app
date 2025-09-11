"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Issue,
  Customer,
  Category,
  Application,
  User,
  IssueStatus,
  IssuePriority,
} from "@/types";
import { IssueModal } from "@/components/issue-modal";
import { createIssue } from "@/app/actions/issues";

interface IssuesClientProps {
  initialIssues: Issue[];
  customers: Customer[];
  categories: Category[];
  applications: Application[];
  users: User[];
}

function getStatusBadgeColor(status: IssueStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "awaiting_customer":
      return "bg-purple-100 text-purple-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityBadgeColor(priority: IssuePriority): string {
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
}

export function IssuesClient({
  initialIssues,
  customers,
  categories,
  applications,
  users,
}: IssuesClientProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateIssue = async (data: {
    title: string;
    description: string;
    priority: IssuePriority;
    customerId: string;
    category?: string;
    assignedToId?: string;
  }) => {
    try {
      // Create a FormData object to match the existing server action signature
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      formData.append("customerId", data.customerId);
      if (data.category) {
        formData.append("category", data.category);
      }
      if (data.assignedToId) {
        formData.append("assignedToId", data.assignedToId);
      }

      // Call the server action - it will redirect to the new issue page
      await createIssue(null, formData);
    } catch (error) {
      console.error("Failed to create issue:", error);
      throw error;
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customerId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Create Issue
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No issues found
          </h3>
          <p className="mb-4 text-gray-600">
            Get started by creating your first support issue.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Create First Issue
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </div>
                      <div className="max-w-md truncate text-sm text-gray-500">
                        {issue.description}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(issue.status)}`}
                    >
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeColor(issue.priority)}`}
                    >
                      {issue.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {getCustomerName(issue.customerId)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        categories={categories}
        applications={applications}
        users={users}
        onSubmit={handleCreateIssue}
      />
    </div>
  );
}
