'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Customer } from '@/types'
import { CustomerModal } from '@/components/customer-modal'
import { createCustomer, updateCustomer, deleteCustomer } from '@/app/actions/customers'

interface CustomersClientProps {
  initialCustomers: Customer[]
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()

  const handleCreateCustomer = async (data: { companyName: string }) => {
    try {
      const newCustomer = await createCustomer(data.companyName)
      setCustomers([newCustomer, ...customers])
    } catch (error) {
      console.error('Failed to create customer:', error)
      throw error
    }
  }

  const handleUpdateCustomer = async (data: { companyName: string }) => {
    if (!editingCustomer) return
    
    try {
      const updatedCustomer = await updateCustomer(editingCustomer.id, data.companyName)
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c))
    } catch (error) {
      console.error('Failed to update customer:', error)
      throw error
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      await deleteCustomer(customerId)
      setCustomers(customers.filter(c => c.id !== customerId))
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('Failed to delete customer. Please try again.')
    }
  }

  const openCreateModal = () => {
    setEditingCustomer(undefined)
    setIsModalOpen(true)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first customer.</p>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add First Customer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
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
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.companyName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{customer.totalIssues}</span>
                      {customer.totalIssues > 0 && (
                        <Link
                          href={`/issues?customerId=${customer.id}`}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <Link
                        href="/issues"
                        className="text-green-600 hover:text-green-900"
                      >
                        Create Issue
                      </Link>
                      {customer.totalIssues === 0 && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        customer={editingCustomer}
        onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
      />
    </div>
  )
}