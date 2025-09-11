"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { IssueStatus } from "@/types";
import { changeIssueStatus } from "@/app/actions/issues";

interface IssueStatusSelectorProps {
  issueId: string;
  currentStatus: IssueStatus;
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
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusDisplayName(status: IssueStatus): string {
  return status.replace("_", " ");
}

export function IssueStatusSelector({
  issueId,
  currentStatus,
}: IssueStatusSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<IssueStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    startTransition(async () => {
      try {
        await changeIssueStatus(issueId, selectedStatus);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update status:", error);
        // Revert on error
        setSelectedStatus(currentStatus);
      }
    });
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
          disabled={isPending}
          className="rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_customer">Awaiting Customer</option>
          <option value="resolved">Resolved</option>
        </select>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(currentStatus)}`}
      >
        {getStatusDisplayName(currentStatus)}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
