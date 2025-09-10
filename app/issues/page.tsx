import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { Issue, Customer, Category } from '@/types'
import { IssuesClient } from './issues-client'

export const dynamic = 'force-dynamic'

async function getPageData(organizationId: string) {
  try {
    const [issues, customers, categories] = await Promise.all([
      dbQueries.getIssues(organizationId),
      dbQueries.getCustomers(organizationId),
      dbQueries.getCategories(organizationId)
    ])
    return { issues, customers, categories }
  } catch (error) {
    console.error('Failed to fetch page data:', error)
    return { issues: [], customers: [], categories: [] }
  }
}

export default async function IssuesPage() {
  const session = await SessionManager.requirePermission('issues:read')
  const { issues, customers, categories } = await getPageData(session.organizationId)

  return <IssuesClient initialIssues={issues} customers={customers} categories={categories} />
}