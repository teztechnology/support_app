'use client'

import { useState } from 'react'
import { Modal } from './modal'
import { Customer } from '@/types'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer
  onSubmit: (data: { companyName: string }) => Promise<void>
}

export function CustomerModal({ isOpen, onClose, customer, onSubmit }: CustomerModalProps) {
  const [companyName, setCompanyName] = useState(customer?.companyName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ companyName: companyName.trim() })
      onClose()
      setCompanyName('')
    } catch (error) {
      console.error('Failed to save customer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setCompanyName(customer?.companyName || '')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter company name"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !companyName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : customer ? 'Update' : 'Add'} Customer
          </button>
        </div>
      </form>
    </Modal>
  )
}