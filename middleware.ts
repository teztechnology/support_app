import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/auth', '/api/auth']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Check if user has session cookie
  const sessionCookie = request.cookies.get('stytch_session')
  const hasSession = !!sessionCookie?.value

  // Redirect to login if trying to access protected route without session
  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if trying to access public route with session
  if (isPublicPath && hasSession && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}