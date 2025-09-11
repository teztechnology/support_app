'use client'

import { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Category } from '@/types'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Category
  onSubmit: (data: {
    name: string
    description: string
    color?: string
    isActive: boolean
  }) => Promise<void>
}

export function CategoryModal({ isOpen, onClose, category, onSubmit }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          description: category.description,
          color: category.color || '',
          isActive: category.isActive
        })
      } else {
        setFormData({
          name: '',
          description: '',
          color: '',
          isActive: true
        })
      }
    }
  }, [isOpen, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color || undefined,
        isActive: formData.isActive
      })
      onClose()
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={category ? 'Edit Category' : 'Create Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Category name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-9 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  disabled={isSubmitting}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  } hover:border-gray-600 transition-colors disabled:opacity-50`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                disabled={isSubmitting}
                placeholder="#000000"
                className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {formData.color && (
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, color: '' })}
                disabled={isSubmitting}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={isSubmitting}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Inactive categories won't appear in issue creation forms
          </p>
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
            disabled={isSubmitting || !formData.name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}