import { redirect } from 'next/navigation'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { createIssue } from '@/app/actions/issues'
import { Customer, Category } from '@/types'

export const dynamic = 'force-dynamic'

async function getCustomers(organizationId: string): Promise<Customer[]> {
  try {
    return await dbQueries.getCustomers(organizationId)
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return []
  }
}

async function getCategories(organizationId: string): Promise<Category[]> {
  try {
    return await dbQueries.getCategories(organizationId)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function NewIssuePage() {
  const session = await SessionManager.requirePermission('issues:write')
  const [customers, categories] = await Promise.all([
    getCustomers(session.organizationId),
    getCategories(session.organizationId)
  ])

  async function createIssueAction(formData: FormData) {
    'use server'
    await createIssue(null, formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Issue</h1>
        <p className="text-gray-600">Fill out the form below to create a new support issue.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form action={createIssueAction} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of the issue, including steps to reproduce, expected behavior, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              id="customerId"
              name="customerId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No customers found. You may need to create a customer first.
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}