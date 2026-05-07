import { type NextRequest, NextResponse } from 'next/server'
import { canAccessAdminLeads, getProfileAccess } from '@/lib/auth/profile-access'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = ['/dashboard', '/onboarding', '/contador', '/admin', '/relatorio', '/upgrade', '/api/v1']
const AUTH_PATHS = ['/auth/login', '/auth/registro', '/auth/recuperar']

function matchesPrefix(pathname: string, paths: string[]) {
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

function redirectWithSessionCookies(request: NextRequest, supabaseResponse: NextResponse, path: string) {
  const url = new URL(path, request.url)
  const response = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { supabaseResponse, supabase, user } = await updateSession(request)
  const isProtected = matchesPrefix(pathname, PROTECTED_PATHS)
  const isAuth = matchesPrefix(pathname, AUTH_PATHS)

  // Protege rotas privadas
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    const response = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

  if (!user || (!isProtected && !isAuth)) {
    return supabaseResponse
  }

  const access = await getProfileAccess(supabase, user)

  if (isAuth) {
    return redirectWithSessionCookies(request, supabaseResponse, access.isComplete ? '/dashboard' : '/onboarding')
  }

  if (pathname.startsWith('/admin/leads') && !canAccessAdminLeads(access.profile, user)) {
    return redirectWithSessionCookies(request, supabaseResponse, '/dashboard')
  }

  if (!pathname.startsWith('/onboarding') && !access.isComplete) {
    return redirectWithSessionCookies(request, supabaseResponse, '/onboarding')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - arquivos com extensão (imagens, fontes, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
