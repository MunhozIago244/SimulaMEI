import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas que exigem autenticação
const PROTECTED_PATHS = ['/dashboard', '/onboarding', '/contador', '/api/v1']
// Rotas de auth — redireciona para /dashboard se já logado
const AUTH_PATHS = ['/auth/login', '/auth/registro']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { supabaseResponse, user } = await updateSession(request)

  // Protege rotas privadas
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redireciona usuário já logado que tenta acessar /auth/*
  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
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
