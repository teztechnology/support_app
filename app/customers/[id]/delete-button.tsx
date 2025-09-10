'use client'

interface DeleteButtonProps {
  deleteAction: () => void
  disabled?: boolean
}

export function DeleteButton({ deleteAction, disabled = false }: DeleteButtonProps) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="px-4 py-2 text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
        title="Cannot delete customer with existing issues"
      >
        Delete Customer
      </button>
    )
  }

  return (
    <form action={deleteAction}>
      <button
        type="submit"
        className="px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            e.preventDefault()
          }
        }}
      >
        Delete Customer
      </button>
    </form>
  )
}