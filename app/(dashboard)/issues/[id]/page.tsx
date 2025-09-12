import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import {
  updateIssue,
  changeIssueStatus,
  addComment,
  deleteComment,
  assignIssue,
} from "@/app/actions/issues";
import {
  Issue,
  Comment,
  Customer,
  User,
  Application,
  IssueStatus,
  IssuePriority,
} from "@/types";
import { CommentActions } from "@/components/comment-actions";
import { IssueStatusSelector } from "@/components/issue-status-selector";
import { IssueAssignmentToggle } from "@/components/issue-assignment-toggle";
import { EscalateToJiraButton } from "@/components/escalate-to-jira-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
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

async function getIssueData(issueId: string, organizationId: string) {
  try {
    const [issue, comments, users] = await Promise.all([
      dbQueries.getIssueById(issueId, organizationId),
      dbQueries.getComments(issueId, organizationId),
      dbQueries.getUsers(organizationId),
    ]);

    if (!issue) return null;

    const [customerData, applicationData] = await Promise.all([
      dbQueries.getCustomerById(issue.customerId, organizationId),
      issue.applicationId
        ? dbQueries.getApplicationById(issue.applicationId, organizationId)
        : null,
    ]);

    return {
      issue,
      comments,
      customer: customerData,
      application: applicationData,
      users,
    };
  } catch (error) {
    console.error("Failed to fetch issue data:", error);
    return null;
  }
}

export default async function IssueDetailPage({ params }: PageProps) {
  const session = await SessionManager.requirePermission("issues:read");
  const data = await getIssueData(params.id, session.organizationId);

  if (!data) {
    notFound();
  }

  const { issue, comments, customer, application, users } = data;
  const assignedUser = issue.assignedToId
    ? users.find((u) => u.id === issue.assignedToId)
    : null;

  // Check if Jira integration is available
  const hasJiraConfig = !!(
    process.env.JIRA_BASE_URL &&
    process.env.JIRA_EMAIL &&
    process.env.JIRA_API_TOKEN
  );
  const canEscalateToJira = !!(application?.jiraProjectKey && hasJiraConfig);
  const canEscalate =
    session.userRole === "admin" || session.userRole === "support_agent";

  async function addCommentAction(formData: FormData) {
    "use server";
    await addComment(null, formData);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <IssueStatusSelector
            issueId={issue.id}
            currentStatus={issue.status}
          />
        </div>
        <div className="flex items-center space-x-4">
          <EscalateToJiraButton
            issueId={issue.id}
            isEscalated={!!issue.jiraIssueKey}
            jiraUrl={issue.jiraUrl}
            jiraKey={issue.jiraIssueKey}
            hasJiraConfig={canEscalateToJira}
            canEscalate={canEscalate}
          />
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeColor(issue.priority)}`}
          >
            {issue.priority}
          </span>
        </div>
      </div>

      {/* Issue Details */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {issue.title}
          </h1>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-3">
            <div>
              <span className="font-medium">Customer:</span>{" "}
              {customer ? customer.companyName : "Unknown Customer"}
            </div>
            <IssueAssignmentToggle
              issueId={issue.id}
              currentAssignedToId={issue.assignedToId}
              assignedUser={assignedUser || undefined}
              users={users}
            />
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(issue.createdAt).toLocaleDateString()} at{" "}
              {new Date(issue.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Description
          </h3>
          <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4">
            {issue.description}
          </div>
        </div>

        {issue.resolutionNotes && (
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Resolution Notes
            </h3>
            <div className="whitespace-pre-wrap rounded-md bg-green-50 p-4">
              {issue.resolutionNotes}
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        <form key={comments.length} action={addCommentAction} className="mb-6">
          <input type="hidden" name="issueId" value={issue.id} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="content"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Add Comment
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your comment..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-md border bg-gray-50 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {comment.userName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()} at{" "}
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </span>
                    <CommentActions
                      commentId={comment.id}
                      organizationId={session.organizationId}
                      canDelete={
                        comment.userId === session.userId ||
                        session.userRole === "admin"
                      }
                    />
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-700">
                  {comment.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
