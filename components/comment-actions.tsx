'use client'

import { useState } from 'react'
import { deleteComment } from '@/app/actions/issues'

interface CommentActionsProps {
  commentId: string
  organizationId: string
  canDelete: boolean
}

export function CommentActions({ commentId, organizationId, canDelete }: CommentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteComment(commentId, organizationId)
      if (!result.success) {
        alert('Failed to delete comment: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!canDelete) {
    return null
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}