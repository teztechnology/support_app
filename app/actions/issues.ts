'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { 
  CreateIssueSchema, 
  UpdateIssueSchema, 
  BulkUpdateIssuesSchema, 
  IssueFilterSchema,
  AddCommentSchema 
} from '@/lib/validations/issue'
import { ServerActionResponse, Issue, Comment, Customer, ActivityItem, FilterParams } from '@/types'
import { generateId } from '@/lib/utils'

export async function createIssue(prevState: any, formData: FormData): Promise<ServerActionResponse<Issue>> {
  try {
    const session = await SessionManager.requirePermission('issues:write')
    
    const validatedFields = CreateIssueSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      category: formData.get('category') || undefined,
      customerId: formData.get('customerId'),
      assignedToId: formData.get('assignedToId') || undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { title, description, priority, category, customerId, assignedToId } = validatedFields.data

    const customer = await dbQueries.getItem<Customer>('customers', customerId, session.organizationId)
    if (!customer) {
      return {
        success: false,
        error: 'Customer not found',
      }
    }

    const issue = await dbQueries.createIssue({
      title,
      description,
      status: 'new',
      priority: priority as any,
      category,
      customerId,
      assignedToId,
      organizationId: session.organizationId,
      createdBy: session.userId,
      attachments: [],
    })

    await dbQueries.updateItem<Customer>(
      'customers',
      customerId,
      {
        ...customer,
        totalIssues: customer.totalIssues + 1,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    )

    const activity: ActivityItem = {
      id: generateId('activity'),
      type: 'issue_created',
      title: `New issue: ${title}`,
      description: `Issue #${issue.id} was created`,
      userId: session.userId,
      userName: session.userName,
      issueId: issue.id,
      timestamp: new Date().toISOString(),
    }

    await dbQueries.createItem('activities', activity, session.organizationId)

    revalidatePath('/issues')
    revalidatePath('/dashboard')
    revalidateTag('issues')
    
    return {
      success: true,
      data: issue,
    }
  } catch (error: any) {
    console.error('Create issue error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create issue',
    }
  }
}

export async function updateIssue(
  issueId: string, 
  prevState: any, 
  formData: FormData
): Promise<ServerActionResponse<Issue>> {
  try {
    const session = await SessionManager.requirePermission('issues:write')
    
    const validatedFields = UpdateIssueSchema.safeParse({
      title: formData.get('title') || undefined,
      description: formData.get('description') || undefined,
      status: formData.get('status') || undefined,
      priority: formData.get('priority') || undefined,
      category: formData.get('category') || undefined,
      assignedToId: formData.get('assignedToId') || undefined,
      resolutionNotes: formData.get('resolutionNotes') || undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const updates = validatedFields.data
    const existingIssue = await dbQueries.getIssueById(issueId, session.organizationId)
    
    if (!existingIssue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    // Add resolvedAt if status is being changed to resolved
    const finalUpdates: any = { ...updates }
    if (updates.status === 'resolved' && !existingIssue.resolvedAt) {
      finalUpdates.resolvedAt = new Date().toISOString()
    }

    const updatedIssue = await dbQueries.updateIssue(
      issueId,
      session.organizationId,
      finalUpdates
    )

    const activity: ActivityItem = {
      id: generateId('activity'),
      type: 'issue_updated',
      title: `Issue updated: ${updatedIssue.title}`,
      description: `Issue #${issueId} was updated`,
      userId: session.userId,
      userName: session.userName,
      issueId,
      timestamp: new Date().toISOString(),
    }

    await dbQueries.createItem('activities', activity, session.organizationId)

    if (updates.status === 'resolved') {
      const resolvedActivity: ActivityItem = {
        id: generateId('activity'),
        type: 'issue_resolved',
        title: `Issue resolved: ${updatedIssue.title}`,
        description: `Issue #${issueId} was resolved`,
        userId: session.userId,
        userName: session.userName,
        issueId,
        timestamp: new Date().toISOString(),
      }

      await dbQueries.createItem('activities', resolvedActivity, session.organizationId)
    }

    revalidatePath('/issues')
    revalidatePath(`/issues/${issueId}`)
    revalidatePath('/dashboard')
    revalidateTag('issues')
    
    return {
      success: true,
      data: updatedIssue,
    }
  } catch (error: any) {
    console.error('Update issue error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update issue',
    }
  }
}

export async function deleteIssue(issueId: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('issues:delete')
    
    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    await dbQueries.deleteItem('issues', issueId, session.organizationId)

    const customer = await dbQueries.getItem<Customer>('customers', issue.customerId, session.organizationId)
    if (customer && customer.totalIssues > 0) {
      await dbQueries.updateItem<Customer>(
        'customers',
        issue.customerId,
        {
          ...customer,
          totalIssues: customer.totalIssues - 1,
          updatedAt: new Date().toISOString(),
        },
        session.organizationId
      )
    }

    revalidatePath('/issues')
    revalidatePath('/dashboard')
    revalidateTag('issues')
    
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Delete issue error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete issue',
    }
  }
}

export async function getIssues(searchParams?: { [key: string]: string | string[] }): Promise<ServerActionResponse<Issue[]>> {
  try {
    const session = await SessionManager.requirePermission('issues:read')
    
    const filters: FilterParams = {}
    
    if (searchParams) {
      if (searchParams.status) {
        filters.status = Array.isArray(searchParams.status) ? searchParams.status as any : [searchParams.status as any]
      }
      if (searchParams.priority) {
        filters.priority = Array.isArray(searchParams.priority) ? searchParams.priority as any : [searchParams.priority as any]
      }
      if (searchParams.assignedToId) {
        filters.assignedToId = searchParams.assignedToId as string
      }
      if (searchParams.customerId) {
        filters.customerId = searchParams.customerId as string
      }
      if (searchParams.category) {
        filters.category = searchParams.category as string
      }
      if (searchParams.search) {
        filters.search = searchParams.search as string
      }
      if (searchParams.sortBy) {
        filters.sortBy = searchParams.sortBy as any
      }
      if (searchParams.sortOrder) {
        filters.sortOrder = searchParams.sortOrder as any
      }
    }

    const issues = await dbQueries.getIssues(session.organizationId, filters)
    
    return {
      success: true,
      data: issues,
    }
  } catch (error: any) {
    console.error('Get issues error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get issues',
    }
  }
}

export async function getIssueById(issueId: string): Promise<ServerActionResponse<Issue>> {
  try {
    const session = await SessionManager.requirePermission('issues:read')
    
    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }
    
    return {
      success: true,
      data: issue,
    }
  } catch (error: any) {
    console.error('Get issue error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get issue',
    }
  }
}

export async function bulkUpdateIssues(prevState: any, formData: FormData): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('issues:write')
    
    const issueIds = formData.get('issueIds')?.toString().split(',') || []
    const updates = {
      status: formData.get('status') || undefined,
      priority: formData.get('priority') || undefined,
      assignedToId: formData.get('assignedToId') || undefined,
      category: formData.get('category') || undefined,
    }

    const validatedFields = BulkUpdateIssuesSchema.safeParse({
      issueIds,
      updates: Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { issueIds: validatedIssueIds, updates: validatedUpdates } = validatedFields.data

    const updatePromises = validatedIssueIds.map(issueId =>
      dbQueries.updateIssue(issueId, session.organizationId, validatedUpdates)
    )

    await Promise.all(updatePromises)

    revalidatePath('/issues')
    revalidatePath('/dashboard')
    revalidateTag('issues')
    
    return {
      success: true,
      data: { updatedCount: validatedIssueIds.length },
    }
  } catch (error: any) {
    console.error('Bulk update issues error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update issues',
    }
  }
}

export async function assignIssue(issueId: string, userId: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('issues:write')
    
    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    const updatedIssue = await dbQueries.updateIssue(
      issueId,
      session.organizationId,
      { assignedToId: userId }
    )

    const activity: ActivityItem = {
      id: generateId('activity'),
      type: 'issue_updated',
      title: `Issue assigned: ${updatedIssue.title}`,
      description: `Issue #${issueId} was assigned to a team member`,
      userId: session.userId,
      userName: session.userName,
      issueId,
      timestamp: new Date().toISOString(),
    }

    await dbQueries.createItem('activities', activity, session.organizationId)

    revalidatePath('/issues')
    revalidatePath(`/issues/${issueId}`)
    revalidateTag('issues')
    
    return {
      success: true,
      data: updatedIssue,
    }
  } catch (error: any) {
    console.error('Assign issue error:', error)
    return {
      success: false,
      error: error.message || 'Failed to assign issue',
    }
  }
}

export async function changeIssueStatus(issueId: string, status: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('issues:write')
    
    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    const updates: any = { status }
    if (status === 'resolved' && !issue.resolvedAt) {
      updates.resolvedAt = new Date().toISOString()
    }

    const updatedIssue = await dbQueries.updateIssue(
      issueId,
      session.organizationId,
      updates
    )

    const activity: ActivityItem = {
      id: generateId('activity'),
      type: status === 'resolved' ? 'issue_resolved' : 'issue_updated',
      title: `Issue ${status}: ${updatedIssue.title}`,
      description: `Issue #${issueId} status changed to ${status}`,
      userId: session.userId,
      userName: session.userName,
      issueId,
      timestamp: new Date().toISOString(),
    }

    await dbQueries.createItem('activities', activity, session.organizationId)

    revalidatePath('/issues')
    revalidatePath(`/issues/${issueId}`)
    revalidatePath('/dashboard')
    revalidateTag('issues')
    
    return {
      success: true,
      data: updatedIssue,
    }
  } catch (error: any) {
    console.error('Change issue status error:', error)
    return {
      success: false,
      error: error.message || 'Failed to change issue status',
    }
  }
}

export async function addComment(prevState: any, formData: FormData): Promise<ServerActionResponse<Comment>> {
  try {
    const session = await SessionManager.requirePermission('issues:read')
    
    const validatedFields = AddCommentSchema.safeParse({
      issueId: formData.get('issueId'),
      content: formData.get('content'),
      isInternal: formData.get('isInternal') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { issueId, content, isInternal } = validatedFields.data

    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    const comment = await dbQueries.addComment({
      issueId,
      userId: session.userId,
      userName: session.userName,
      content,
      isInternal,
      attachments: [],
    })

    const activity: ActivityItem = {
      id: generateId('activity'),
      type: 'comment_added',
      title: `Comment added to: ${issue.title}`,
      description: `New comment added to issue #${issueId}`,
      userId: session.userId,
      userName: session.userName,
      issueId,
      timestamp: new Date().toISOString(),
    }

    await dbQueries.createItem('activities', activity, session.organizationId)

    revalidatePath(`/issues/${issueId}`)
    revalidateTag('comments')
    
    return {
      success: true,
      data: comment,
    }
  } catch (error: any) {
    console.error('Add comment error:', error)
    return {
      success: false,
      error: error.message || 'Failed to add comment',
    }
  }
}

export async function getComments(issueId: string): Promise<ServerActionResponse<Comment[]>> {
  try {
    const session = await SessionManager.requirePermission('issues:read')
    
    const issue = await dbQueries.getIssueById(issueId, session.organizationId)
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
      }
    }

    const comments = await dbQueries.getComments(issueId, session.organizationId)
    
    return {
      success: true,
      data: comments,
    }
  } catch (error: any) {
    console.error('Get comments error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get comments',
    }
  }
}