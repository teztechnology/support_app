'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authenticateB2BSession, getB2BOrganization, inviteB2BMember } from '@/lib/stytch/server-client'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { LoginSchema, SignupSchema, InviteUserSchema, UpdateUserRoleSchema } from '@/lib/validations/auth'
import { ServerActionResponse, Organization, User } from '@/types'
import { generateId } from '@/lib/utils'

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        'issues:read',
        'issues:write',
        'issues:delete',
        'customers:read',
        'customers:write',
        'users:read',
        'users:write',
        'reports:read',
        'settings:write'
      ]
    case 'support_agent':
      return [
        'issues:read',
        'issues:write',
        'customers:read',
        'customers:write',
        'reports:read'
      ]
    case 'read_only':
    default:
      return ['issues:read', 'customers:read']
  }
}

export async function authenticateUser(): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.validateSession()
    return {
      success: !!session,
      data: session,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
    }
  }
}

export async function logoutUser(): Promise<ServerActionResponse> {
  try {
    await SessionManager.revokeSession()
    redirect('/login')
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: 'Logout failed',
    }
  }
}

export async function handleStytchCallback(
  stytchToken: string,
  stytchOrganizationId?: string
): Promise<ServerActionResponse> {
  try {
    const stytchResponse = await authenticateB2BSession(
      stytchToken,
      stytchOrganizationId
    )

    if (!stytchResponse.session || !stytchResponse.member || !stytchResponse.organization) {
      return {
        success: false,
        error: 'Invalid authentication response from Stytch',
      }
    }

    let organization = await dbQueries.getOrganizationByStytchId(
      stytchResponse.organization.organization_id
    )

    if (!organization) {
      organization = await dbQueries.createItem<Organization>('organizations', {
        id: generateId('org'),
        name: stytchResponse.organization.organization_name,
        stytchOrganizationId: stytchResponse.organization.organization_id,
        domain: stytchResponse.organization.email_allowed_domains?.[0],
        settings: {
          allowSelfRegistration: true,
          defaultUserRole: 'read_only',
          requireApproval: false,
          customFields: [],
          branding: {},
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, generateId('org'))
    }

    let user = await dbQueries.getUserByStytchMemberId(stytchResponse.member.member_id)

    if (!user) {
      const isFirstUser = (await dbQueries.getUsers(organization.id)).length === 0
      
      user = await SessionManager.createUserFromStytchMember(
        stytchResponse.member,
        organization,
        isFirstUser ? 'admin' : organization.settings.defaultUserRole
      )
    }

    await dbQueries.updateItem<User>(
      'users',
      user.id,
      {
        ...user,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      user.organizationId
    )

    await SessionManager.setSessionCookies(stytchToken, organization.id)

    return {
      success: true,
      data: {
        userId: user.id,
        organizationId: organization.id,
        userRole: user.role,
      },
    }
  } catch (error) {
    console.error('Stytch callback error:', error)
    return {
      success: false,
      error: 'Authentication failed',
    }
  }
}

export async function inviteUser(prevState: any, formData: FormData): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requireRole(['admin'])
    
    const validatedFields = InviteUserSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { email, name, role } = validatedFields.data

    const organization = await dbQueries.getItem<Organization>(
      'organizations',
      session.organizationId,
      session.organizationId
    )

    if (!organization) {
      return {
        success: false,
        error: 'Organization not found',
      }
    }

    const stytchOrg = await getB2BOrganization(
      organization.stytchOrganizationId
    )

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
    
    await inviteB2BMember(
      organization.stytchOrganizationId,
      email,
      inviteUrl,
      name
    )

    revalidatePath('/settings/team')
    
    return {
      success: true,
      data: { email, name, role },
    }
  } catch (error: any) {
    console.error('Invite user error:', error)
    return {
      success: false,
      error: error.message || 'Failed to invite user',
    }
  }
}

export async function updateUserRole(prevState: any, formData: FormData): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requireRole(['admin'])
    
    const validatedFields = UpdateUserRoleSchema.safeParse({
      userId: formData.get('userId'),
      role: formData.get('role'),
      permissions: formData.get('permissions')?.toString().split(',').filter(Boolean),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { userId, role, permissions } = validatedFields.data

    if (userId === session.userId) {
      return {
        success: false,
        error: 'You cannot change your own role',
      }
    }

    const user = await dbQueries.getItem<User>('users', userId, session.organizationId)
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const defaultPermissions = getDefaultPermissions(role)

    const updatedUser = await dbQueries.updateItem<User>(
      'users',
      userId,
      {
        ...user,
        role: role as any,
        permissions: permissions || defaultPermissions,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    )

    revalidatePath('/settings/team')
    
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error: any) {
    console.error('Update user role error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update user role',
    }
  }
}

export async function deactivateUser(userId: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requireRole(['admin'])
    
    if (userId === session.userId) {
      return {
        success: false,
        error: 'You cannot deactivate yourself',
      }
    }

    const user = await dbQueries.getItem<User>('users', userId, session.organizationId)
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const updatedUser = await dbQueries.updateItem<User>(
      'users',
      userId,
      {
        ...user,
        isActive: false,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    )

    revalidatePath('/settings/team')
    
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error: any) {
    console.error('Deactivate user error:', error)
    return {
      success: false,
      error: error.message || 'Failed to deactivate user',
    }
  }
}

export async function getCurrentUser(): Promise<ServerActionResponse<User>> {
  try {
    const session = await SessionManager.requireAuth()
    const user = await dbQueries.getItem<User>('users', session.userId, session.organizationId)
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get current user',
    }
  }
}

export async function getOrganizationUsers(): Promise<ServerActionResponse<User[]>> {
  try {
    const session = await SessionManager.requireAuth()
    const users = await dbQueries.getUsers(session.organizationId)
    
    return {
      success: true,
      data: users,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get organization users',
    }
  }
}