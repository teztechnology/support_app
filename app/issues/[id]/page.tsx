import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { updateIssue, changeIssueStatus, addComment } from '@/app/actions/issues'
import { Issue, Comment, Customer, User, IssueStatus, IssuePriority } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

function getStatusBadgeColor(status: IssueStatus): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'awaiting_customer':
      return 'bg-purple-100 text-purple-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    case 'closed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityBadgeColor(priority: IssuePriority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

async function getIssueData(issueId: string, organizationId: string) {
  try {
    const [issue, comments, customer, users] = await Promise.all([
      dbQueries.getIssueById(issueId, organizationId),
      dbQueries.getComments(issueId, organizationId),
      null, // We'll get customer after we have the issue
      dbQueries.getUsers(organizationId)
    ])

    if (!issue) return null

    const customerData = await dbQueries.getCustomerById(issue.customerId, organizationId)

    return {
      issue,
      comments,
      customer: customerData,
      users
    }
  } catch (error) {
    console.error('Failed to fetch issue data:', error)
    return null
  }
}

export default async function IssueDetailPage({ params }: PageProps) {
  const session = await SessionManager.requirePermission('issues:read')
  const data = await getIssueData(params.id, session.organizationId)

  if (!data) {
    notFound()
  }

  const { issue, comments, customer, users } = data
  const assignedUser = issue.assignedToId 
    ? users.find(u => u.id === issue.assignedToId) 
    : null

  async function addCommentAction(formData: FormData) {
    'use server'
    await addComment(null, formData)
  }

  async function changeStatusAction(formData: FormData) {
    'use server'
    const status = formData.get('status') as IssueStatus
    await changeIssueStatus(params.id, status)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/issues" className="text-blue-600 hover:text-blue-800">
            ← Back to Issues
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(issue.status)}`}>
            {issue.status.replace('_', ' ')}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(issue.priority)}`}>
            {issue.priority}
          </span>
        </div>
      </div>

      {/* Issue Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{issue.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Customer:</span>{' '}
              {customer ? customer.companyName : 'Unknown Customer'}
            </div>
            <div>
              <span className="font-medium">Assigned to:</span>{' '}
              {assignedUser ? assignedUser.name : 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(issue.createdAt).toLocaleDateString()} at{' '}
              {new Date(issue.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <div className="bg-gray-50 rounded-md p-4 whitespace-pre-wrap">
            {issue.description}
          </div>
        </div>

        {issue.resolutionNotes && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Resolution Notes</h3>
            <div className="bg-green-50 rounded-md p-4 whitespace-pre-wrap">
              {issue.resolutionNotes}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="in_progress" />
            <button
              type="submit"
              disabled={issue.status === 'in_progress'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark In Progress
            </button>
          </form>

          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="resolved" />
            <button
              type="submit"
              disabled={issue.status === 'resolved' || issue.status === 'closed'}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Resolved
            </button>
          </form>

          <form action={changeStatusAction}>
            <input type="hidden" name="status" value="awaiting_customer" />
            <button
              type="submit"
              disabled={issue.status === 'awaiting_customer'}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Awaiting Customer
            </button>
          </form>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comments ({comments.length})</h3>
        
        {/* Add Comment Form */}
        <form action={addCommentAction} className="mb-6">
          <input type="hidden" name="issueId" value={issue.id} />
          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Add Comment
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your comment..."
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isInternal"
                  value="true"
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-600">Internal comment (not visible to customer)</span>
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`border rounded-md p-4 ${comment.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{comment.userName}</span>
                    {comment.isInternal && (
                      <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                        Internal
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                    {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
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
  )
}