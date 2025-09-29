"use client";

import { useState } from "react";
import {
  Issue,
  Comment,
  Customer,
  Category,
  Application,
  User,
  IssueStatus,
  IssuePriority,
} from "@/types";
import { IssueEditModal } from "@/components/issue-edit-modal";
import { updateIssue } from "@/app/actions/issues";

interface IssueDetailClientProps {
  issue: Issue;
  customers: Customer[];
  categories: Category[];
  applications: Application[];
  users: User[];
  children: React.ReactNode;
}

export function IssueDetailClient({
  issue: initialIssue,
  customers,
  categories,
  applications,
  users,
  children,
}: IssueDetailClientProps) {
  const [issue, setIssue] = useState(initialIssue);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditIssue = async (data: {
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    customerId: string;
    category?: string;
    applicationId?: string;
    assignedToId?: string;
    resolutionNotes?: string;
  }) => {
    try {
      // Create a FormData object to match the existing server action signature
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("status", data.status);
      formData.append("priority", data.priority);
      formData.append("customerId", data.customerId);
      if (data.category) {
        formData.append("category", data.category);
      }
      if (data.applicationId) {
        formData.append("applicationId", data.applicationId);
      }
      if (data.assignedToId) {
        formData.append("assignedToId", data.assignedToId);
      }
      if (data.resolutionNotes) {
        formData.append("resolutionNotes", data.resolutionNotes);
      }

      // Call the server action and get the result
      const result = await updateIssue(issue.id, null, formData);

      if (result.success && result.data) {
        // Update the issue in the local state
        setIssue(result.data);
        // Close the modal
        setIsEditModalOpen(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error(result.error || "Failed to update issue");
      }
    } catch (error) {
      console.error("Failed to update issue:", error);
      throw error;
    }
  };

  return (
    <div className="relative">
      {/* Edit Button - Positioned absolutely in top right of the header card */}
      <div className="absolute right-6 top-6 z-10">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit Issue
        </button>
      </div>

      {/* Render the server-side content */}
      {children}

      {/* Edit Modal */}
      <IssueEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        issue={issue}
        customers={customers}
        categories={categories}
        applications={applications}
        users={users}
        onSubmit={handleEditIssue}
      />
    </div>
  );
}
