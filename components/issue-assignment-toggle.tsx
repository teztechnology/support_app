"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { User } from "@/types";
import { assignIssue } from "@/app/actions/issues";

interface IssueAssignmentToggleProps {
  issueId: string;
  currentAssignedToId?: string;
  assignedUser?: User;
  users: User[];
}

export function IssueAssignmentToggle({
  issueId,
  currentAssignedToId,
  assignedUser,
  users,
}: IssueAssignmentToggleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(
    currentAssignedToId || ""
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", selectedUserId);
        await assignIssue(issueId, selectedUserId);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update assignment:", error);
        // Revert on error
        setSelectedUserId(currentAssignedToId || "");
      }
    });
  };

  const handleCancel = () => {
    setSelectedUserId(currentAssignedToId || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <span className="font-medium">Assigned to:</span>
        <div className="flex items-center space-x-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={isPending}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
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
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium">Assigned to:</span>
      <span className="text-gray-900">
        {assignedUser ? assignedUser.name : "Unassigned"}
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
