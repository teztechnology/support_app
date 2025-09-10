import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { Customer } from '@/types'
import { CustomersClient } from './customers-client'

export const dynamic = 'force-dynamic'

async function getCustomers(organizationId: string): Promise<Customer[]> {
  try {
    return await dbQueries.getCustomers(organizationId)
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return []
  }
}

export default async function CustomersPage() {
  const session = await SessionManager.requirePermission('customers:read')
  const customers = await getCustomers(session.organizationId)

  return <CustomersClient initialCustomers={customers} />
}