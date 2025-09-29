"use client";

import { useState, useEffect } from "react";
import { Modal } from "./modal";
import {
  Customer,
  Category,
  Application,
  User,
  IssuePriority,
  IssueStatus,
  Issue,
} from "@/types";

interface IssueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue;
  customers: Customer[];
  categories: Category[];
  applications?: Application[];
  users?: User[];
  onSubmit: (data: {
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    customerId: string;
    category?: string;
    applicationId?: string;
    assignedToId?: string;
    resolutionNotes?: string;
  }) => Promise<void>;
}

export function IssueEditModal({
  isOpen,
  onClose,
  issue,
  customers,
  categories,
  applications = [],
  users = [],
  onSubmit,
}: IssueEditModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "new" as IssueStatus,
    priority: "medium" as IssuePriority,
    customerId: "",
    category: "",
    applicationId: "",
    assignedToId: "",
    resolutionNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && issue) {
      setFormData({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        customerId: issue.customerId,
        category: issue.category || "",
        applicationId: issue.applicationId || "",
        assignedToId: issue.assignedToId || "",
        resolutionNotes: issue.resolutionNotes || "",
      });
    }
  }, [isOpen, issue]);

  // Filter categories based on selected application
  const availableCategories = formData.applicationId
    ? categories.filter((cat) => cat.applicationId === formData.applicationId)
    : [];

  // Clear category when application changes
  const handleApplicationChange = (applicationId: string) => {
    setFormData((prev) => ({
      ...prev,
      applicationId,
      category: "", // Clear category when application changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.customerId
    )
      return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        customerId: formData.customerId,
        category: formData.category || undefined,
        applicationId: formData.applicationId || undefined,
        assignedToId: formData.assignedToId || undefined,
        resolutionNotes: formData.resolutionNotes || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update issue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Issue: ${issue?.title || ""}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            disabled={isSubmitting}
            maxLength={200}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            disabled={isSubmitting}
            rows={4}
            maxLength={5000}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Detailed description of the issue..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as IssueStatus,
                })
              }
              required
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer">Awaiting Customer</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Priority *
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as IssuePriority,
                })
              }
              required
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="applicationId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Application
            </label>
            <select
              id="applicationId"
              value={formData.applicationId}
              onChange={(e) => handleApplicationChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select application</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              disabled={isSubmitting || !formData.applicationId}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {formData.applicationId
                  ? "Select category"
                  : "Select application first"}
              </option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="customerId"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Customer *
          </label>
          <select
            id="customerId"
            value={formData.customerId}
            onChange={(e) =>
              setFormData({ ...formData, customerId: e.target.value })
            }
            required
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="assignedToId"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Assign to
          </label>
          <select
            id="assignedToId"
            value={formData.assignedToId}
            onChange={(e) =>
              setFormData({ ...formData, assignedToId: e.target.value })
            }
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {formData.status === "resolved" && (
          <div>
            <label
              htmlFor="resolutionNotes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Resolution Notes
            </label>
            <textarea
              id="resolutionNotes"
              value={formData.resolutionNotes}
              onChange={(e) =>
                setFormData({ ...formData, resolutionNotes: e.target.value })
              }
              disabled={isSubmitting}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Describe how the issue was resolved..."
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.title.trim() ||
              !formData.description.trim() ||
              !formData.customerId
            }
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Issue"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
