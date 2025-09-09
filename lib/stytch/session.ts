import { cookies } from 'next/headers'
import { authenticateB2BSession, deleteB2BSession } from './server-client'
import { dbQueries } from '@/lib/cosmos/queries'
import { SessionData, User, Organization } from '@/types'

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

const SESSION_COOKIE_NAME = 'stytch_session'
const ORGANIZATION_COOKIE_NAME = 'stytch_organization'

export class SessionManager {
  static async getSessionToken(): Promise<string | null> {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
    return sessionCookie?.value || null
  }

  static async getOrganizationId(): Promise<string | null> {
    const cookieStore = cookies()
    const orgCookie = cookieStore.get(ORGANIZATION_COOKIE_NAME)
    return orgCookie?.value || null
  }

  static async validateSession(): Promise<SessionData | null> {
    try {
      const { cookies } = await import('next/headers')
      const { getStytchB2BServerClient } = await import('./server-client')
      
      const cookieStore = cookies()
      
      // Try both possible JWT tokens
      let jwtToken = cookieStore.get('stytch_session_jwt')?.value
      if (!jwtToken) {
        jwtToken = cookieStore.get('tzv_b2b_token')?.value
      }
      
      if (!jwtToken) {
        return null
      }

      // Use JWT authentication
      const client = getStytchB2BServerClient()
      const response = await client.sessions.authenticateJwt({
        session_jwt: jwtToken,
      })
      
      if (!response.member_session || !response.member_session.member_id) {
        return null
      }

      const memberId = response.member_session.member_id
      const organizationId = process.env.NEXT_PUBLIC_STYTCH_BUSINESS_ORG_ID!

      // Skip member details fetch for now to avoid the body consumption error
      // This is a temporary fix - we can add member details later if needed
      let memberDetails = null
      // try {
      //   const memberResponse = await client.organizations.members.get({
      //     organization_id: organizationId,
      //     member_id: memberId,
      //   })
      //   memberDetails = memberResponse.member
      // } catch (error) {
      //   console.log('Could not get member details in SessionManager:', error)
      // }

      // Return session data with available information
      const sessionData: SessionData = {
        userId: memberId,
        organizationId: organizationId,
        stytchSessionId: response.member_session.member_session_id,
        stytchMemberId: memberId,
        userRole: 'admin', // Default role for now
        permissions: ['issues:read', 'issues:write', 'customers:read', 'customers:write'],
        organizationName: 'Support Organization', // Default for now
        userName: memberDetails?.name || memberDetails?.email_address || memberId,
        userEmail: memberDetails?.email_address || '',
        expiresAt: response.member_session.expires_at,
      }

      return sessionData
    } catch (error) {
      console.error('Session validation failed:', error)
      return null
    }
  }

  static async requireAuth(): Promise<SessionData> {
    const session = await this.validateSession()
    if (!session) {
      throw new Error('Unauthorized: Valid session required')
    }
    return session
  }

  static async requireRole(allowedRoles: string[]): Promise<SessionData> {
    const session = await this.requireAuth()
    if (!allowedRoles.includes(session.userRole)) {
      throw new Error(`Forbidden: Requires one of roles: ${allowedRoles.join(', ')}`)
    }
    return session
  }

  static async requirePermission(permission: string): Promise<SessionData> {
    const session = await this.requireAuth()
    if (!session.permissions.includes(permission)) {
      throw new Error(`Forbidden: Requires permission: ${permission}`)
    }
    return session
  }

  static async setSessionCookies(sessionToken: string, organizationId: string) {
    const cookieStore = cookies()
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    cookieStore.set(ORGANIZATION_COOKIE_NAME, organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
  }

  static async clearSessionCookies() {
    const cookieStore = cookies()
    
    cookieStore.delete(SESSION_COOKIE_NAME)
    cookieStore.delete(ORGANIZATION_COOKIE_NAME)
  }

  static async revokeSession(): Promise<void> {
    try {
      const sessionToken = await this.getSessionToken()
      if (sessionToken) {
        await deleteB2BSession(sessionToken)
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
    } finally {
      await this.clearSessionCookies()
    }
  }

  static async createUserFromStytchMember(
    stytchMember: any,
    organization: Organization,
    role: string = 'read_only'
  ): Promise<User> {
    const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      name: stytchMember.name || stytchMember.email_address,
      email: stytchMember.email_address,
      role: role as any,
      organizationId: organization.id,
      stytchMemberId: stytchMember.member_id,
      permissions: getDefaultPermissions(role),
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    }

    return dbQueries.createItem<User>('users', {
      ...newUser,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, organization.id)
  }

}

export async function getSession(): Promise<SessionData | null> {
  return SessionManager.validateSession()
}

export async function requireAuth(): Promise<SessionData> {
  return SessionManager.requireAuth()
}

export async function requireRole(roles: string[]): Promise<SessionData> {
  return SessionManager.requireRole(roles)
}

export async function requirePermission(permission: string): Promise<SessionData> {
  return SessionManager.requirePermission(permission)
}