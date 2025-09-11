'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Issue, Customer, Category, Application, User, IssueStatus, IssuePriority } from '@/types'
import { IssueModal } from '@/components/issue-modal'
import { createIssue } from '@/app/actions/issues'

interface IssuesClientProps {
  initialIssues: Issue[]
  customers: Customer[]
  categories: Category[]
  applications: Application[]
  users: User[]
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

export function IssuesClient({ initialIssues, customers, categories, applications, users }: IssuesClientProps) {
  const [issues, setIssues] = useState(initialIssues)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateIssue = async (data: {
    title: string
    description: string
    priority: IssuePriority
    customerId: string
    category?: string
    assignedToId?: string
  }) => {
    try {
      // Create a FormData object to match the existing server action signature
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('priority', data.priority)
      formData.append('customerId', data.customerId)
      if (data.category) {
        formData.append('category', data.category)
      }
      if (data.assignedToId) {
        formData.append('assignedToId', data.assignedToId)
      }

      // Call the server action - it will redirect to the new issue page
      await createIssue(null, formData)
    } catch (error) {
      console.error('Failed to create issue:', error)
      throw error
    }
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.companyName || customerId
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Issue
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first support issue.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create First Issue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {issue.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCustomerName(issue.customerId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
  )
}