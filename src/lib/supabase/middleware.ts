import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, pass through without session handling
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        supabaseResponse.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        supabaseResponse.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  // IMPORTANT: Don't use getUser() here as it can cause issues
  // Just refresh the session - this is enough for session management
  await supabase.auth.getSession()

  return supabaseResponse
}

// Protected routes configuration
export const protectedRoutes = [
  '/conversation',
  '/stories',
  '/life-book',
  '/profile',
  '/timeline',
  '/photo-detective',
]

export const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/onboarding',
]

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
}
