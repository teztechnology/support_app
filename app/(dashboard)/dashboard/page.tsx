import { Suspense } from 'react'
import { getDashboardStats, getRecentActivity } from '@/app/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils'

async function DashboardStats() {
  const statsResponse = await getDashboardStats()
  
  if (!statsResponse.success || !statsResponse.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load dashboard stats</p>
      </div>
    )
  }

  const stats = statsResponse.data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalIssues}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Open Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.openIssues}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Resolved Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.resolvedIssues}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Critical Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.criticalIssues}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentActivity() {
  const activityResponse = await getRecentActivity(10)
  
  if (!activityResponse.success || !activityResponse.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent activity</p>
      </div>
    )
  }

  const activities = activityResponse.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No recent activity to display
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.description}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-gray-400">
                    <span>By {activity.userName}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
                {activity.issueId && (
                  <a
                    href={`/issues/${activity.issueId}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Issue
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-50">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your support ticket system
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/issues/new"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Issue
              </a>
              <a
                href="/customers/new"
                className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Add New Customer
              </a>
              <a
                href="/issues"
                className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                View All Issues
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}