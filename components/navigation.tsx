'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  userRole: string
}

export function Navigation({ userRole }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/issues', label: 'Issues' },
    { href: '/customers', label: 'Customers' },
    { href: '/reports', label: 'Reports' },
  ]

  if (userRole === 'admin') {
    navItems.push({ href: '/settings', label: 'Settings' })
  }

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}