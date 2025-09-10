import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { updateCustomer, deleteCustomer } from '@/app/actions/customers'
import { Customer, Issue } from '@/types'
import { DeleteButton } from './delete-button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

async function getCustomerData(customerId: string, organizationId: string) {
  try {
    const [customer, issues] = await Promise.all([
      dbQueries.getCustomerById(customerId, organizationId),
      dbQueries.getIssues(organizationId, { customerId })
    ])

    if (!customer) return null

    return { customer, issues }
  } catch (error) {
    console.error('Failed to fetch customer data:', error)
    return null
  }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const session = await SessionManager.requirePermission('customers:read')
  const data = await getCustomerData(params.id, session.organizationId)

  if (!data) {
    notFound()
  }

  const { customer, issues } = data

  async function updateCustomerAction(formData: FormData) {
    'use server'
    await updateCustomer(params.id, formData)
  }

  async function deleteCustomerAction() {
    'use server'
    await deleteCustomer(params.id)
    // Redirect will be handled by the server action if successful
  }

  const canDelete = issues.length === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/customers" className="text-blue-600 hover:text-blue-800">
            ← Back to Customers
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/issues/new?customerId=${customer.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Create Issue
          </Link>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{customer.name}</h1>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">Email:</span> {customer.email}</div>
              {customer.phone && (
                <div><span className="font-medium">Phone:</span> {customer.phone}</div>
              )}
              {customer.company && (
                <div><span className="font-medium">Company:</span> {customer.company}</div>
              )}
              <div><span className="font-medium">Total Issues:</span> {customer.totalIssues}</div>
              <div><span className="font-medium">Customer Since:</span> {new Date(customer.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form action={updateCustomerAction} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-t pt-6">Edit Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={customer.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                defaultValue={customer.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                defaultValue={customer.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                defaultValue={customer.company || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              <DeleteButton 
                deleteAction={deleteCustomerAction}
                disabled={!canDelete}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Customer
            </button>
          </div>
        </form>
      </div>

      {/* Customer Issues */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Issues ({issues.length})
        </h3>
        
        {issues.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No issues found for this customer.</p>
        ) : (
          <div className="overflow-x-auto">
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
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {issue.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {issue.priority}
                      </span>
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
      </div>
    </div>
  )
}