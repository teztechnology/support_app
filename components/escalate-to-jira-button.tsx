"use client";

import { useState } from "react";
import { escalateToJira } from "@/lib/jira/actions";

interface EscalateToJiraButtonProps {
  issueId: string;
  isEscalated: boolean;
  jiraUrl?: string;
  jiraKey?: string;
  hasJiraConfig: boolean;
  canEscalate: boolean;
}

export function EscalateToJiraButton({
  issueId,
  isEscalated,
  jiraUrl,
  jiraKey,
  hasJiraConfig,
  canEscalate,
}: EscalateToJiraButtonProps) {
  const [isEscalating, setIsEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEscalate = async () => {
    setIsEscalating(true);
    setError(null);

    try {
      const result = await escalateToJira(issueId);

      if (result.success) {
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        setError(result.error || "Failed to escalate to Jira");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsEscalating(false);
    }
  };

  // If already escalated, show the Jira link
  if (isEscalated && jiraUrl && jiraKey) {
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Escalated
        </span>
        <a
          href={jiraUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View in Jira ({jiraKey})
        </a>
      </div>
    );
  }

  // If not configured or user can't escalate, show disabled state
  if (!hasJiraConfig || !canEscalate) {
    return (
      <button
        disabled
        className="inline-flex cursor-not-allowed items-center rounded-md bg-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-500"
        title={
          !hasJiraConfig
            ? "Jira integration not configured"
            : "You don't have permission to escalate issues"
        }
      >
        Escalate to Jira
      </button>
    );
  }

  // Show escalation button
  return (
    <div className="space-y-2">
      <button
        onClick={handleEscalate}
        disabled={isEscalating}
        className="inline-flex items-center rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isEscalating ? "Escalating..." : "Escalate to Jira"}
      </button>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}
