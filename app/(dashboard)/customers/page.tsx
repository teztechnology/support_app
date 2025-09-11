import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { Customer, Category, Application, User } from '@/types'
import { CustomersClient } from './customers-client'

export const dynamic = 'force-dynamic'

async function getPageData(organizationId: string) {
  try {
    const [customers, categories, applications, users] = await Promise.all([
      dbQueries.getCustomers(organizationId),
      dbQueries.getCategories(organizationId),
      dbQueries.getApplications(organizationId),
      dbQueries.getUsers(organizationId)
    ])
    return { customers, categories, applications, users }
  } catch (error) {
    console.error('Failed to fetch page data:', error)
    return { customers: [], categories: [], applications: [], users: [] }
  }
}

export default async function CustomersPage() {
  const session = await SessionManager.requirePermission('customers:read')
  const { customers, categories, applications, users } = await getPageData(session.organizationId)

  return <CustomersClient initialCustomers={customers} categories={categories} applications={applications} users={users} />
}