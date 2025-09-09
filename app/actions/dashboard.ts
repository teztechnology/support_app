'use server'

import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { ServerActionResponse, DashboardStats, ActivityItem } from '@/types'

export async function getDashboardStats(
  dateRange?: { start: string; end: string }
): Promise<ServerActionResponse<DashboardStats>> {
  try {
    const session = await SessionManager.requireAuth()
    const stats = await dbQueries.getDashboardStats(session.organizationId, dateRange)
    
    return {
      success: true,
      data: stats,
    }
  } catch (error: any) {
    console.error('Get dashboard stats error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get dashboard stats',
    }
  }
}

export async function getRecentActivity(limit: number = 10): Promise<ServerActionResponse<ActivityItem[]>> {
  try {
    const session = await SessionManager.requireAuth()
    
    const querySpec = {
      query: 'SELECT TOP @limit * FROM c WHERE c.organizationId = @organizationId ORDER BY c.timestamp DESC',
      parameters: [
        { name: '@limit', value: limit },
        { name: '@organizationId', value: session.organizationId }
      ]
    }
    
    const activities = await dbQueries.queryItems<ActivityItem>('activities', querySpec)
    
    return {
      success: true,
      data: activities,
    }
  } catch (error: any) {
    console.error('Get recent activity error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get recent activity',
    }
  }
}