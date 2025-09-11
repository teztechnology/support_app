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
  IssueStatus,
  IssuePriority,
} from "@/types";
import { CommentActions } from "@/components/comment-actions";

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

async function getIssueData(issueId: string, organizationId: string) {
  try {
    const [issue, comments, customer, users] = await Promise.all([
      dbQueries.getIssueById(issueId, organizationId),
      dbQueries.getComments(issueId, organizationId),
      null, // We'll get customer after we have the issue
      dbQueries.getUsers(organizationId),
    ]);

    if (!issue) return null;

    const customerData = await dbQueries.getCustomerById(
      issue.customerId,
      organizationId
    );

    return {
      issue,
      comments,
      customer: customerData,
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

  const { issue, comments, customer, users } = data;
  const assignedUser = issue.assignedToId
    ? users.find((u) => u.id === issue.assignedToId)
    : null;

  async function addCommentAction(formData: FormData) {
    "use server";
    await addComment(null, formData);
  }

  async function changeStatusAction(formData: FormData) {
    "use server";
    const status = formData.get("status") as IssueStatus;
    await changeIssueStatus(params.id, status);
  }

  async function assignUserAction(userId: string) {
    "use server";
    await assignIssue(params.id, userId);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/issues" className="text-blue-600 hover:text-blue-800">
            ← Back to Issues
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(issue.status)}`}
          >
            {issue.status.replace("_", " ")}
          </span>
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
            <div>
              <span className="font-medium">Assigned to:</span>{" "}
              <select
                value={issue.assignedToId || ""}
                onChange={async (e) => {
                  await assignUserAction(e.target.value);
                  window.location.reload(); // Simple refresh to show updated assignment
                }}
                className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
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

      {/* Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="in_progress" />
            <button
              type="submit"
              disabled={issue.status === "in_progress"}
              className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark In Progress
            </button>
          </form>

          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="resolved" />
            <button
              type="submit"
              disabled={
                issue.status === "resolved" || issue.status === "closed"
              }
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Resolved
            </button>
          </form>

          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="awaiting_customer" />
            <button
              type="submit"
              disabled={issue.status === "awaiting_customer"}
              className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Awaiting Customer
            </button>
          </form>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        <form action={addCommentAction} className="mb-6">
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
