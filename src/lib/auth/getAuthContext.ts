/**
 * Server-side auth context for API routes.
 *
 * Works in both Edge and Node.js runtimes.
 * Returns authenticated user if available, otherwise falls back
 * to anonymous mode with IP-based rate limiting.
 *
 * Inspired by Loomiverse _usage.js getUserFromRequest().
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { checkRateLimit } from './rateLimit'

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  rateLimitKey: string
}

/**
 * Get auth context from request cookies.
 * Does NOT require authentication — returns null user for anonymous visitors.
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Auth] CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'All users will be treated as anonymous. Set these env vars to enable authentication.'
    )
    const ip = getClientIP(request)
    return { user: null, isAuthenticated: false, rateLimitKey: `ip:${ip}` }
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return {
        user,
        isAuthenticated: true,
        rateLimitKey: `user:${user.id}`,
      }
    }
  } catch (error) {
    // Log auth failures loudly — silent degradation to anonymous is dangerous.
    // A normal "no session" returns user: null without throwing.
    // If we're here, something is actually broken (Supabase down, bad config, etc.)
    console.error('[Auth] Supabase auth check threw an error. Falling back to anonymous:', error)
  }

  const ip = getClientIP(request)
  return { user: null, isAuthenticated: false, rateLimitKey: `ip:${ip}` }
}

/**
 * Require authentication — returns 401 if not logged in.
 * Use for expensive endpoints like photo analysis.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  const ctx = await getAuthContext(request)

  if (!ctx.isAuthenticated || !ctx.user) {
    return NextResponse.json(
      { error: 'Please sign in to use this feature.' },
      { status: 401 }
    )
  }

  // Rate limit authenticated users too
  const rateCheck = checkRateLimit(ctx.rateLimitKey, true)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Please wait a moment before trying again.' },
      { status: 429 }
    )
  }

  return { user: ctx.user }
}

/**
 * Soft auth with rate limiting — allows anonymous but rate-limits harder.
 * Use for chat, TTS, and transcribe endpoints.
 */
export async function softAuth(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext(request)

  const rateCheck = checkRateLimit(ctx.rateLimitKey, ctx.isAuthenticated)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Please wait a moment before trying again.' },
      { status: 429 }
    )
  }

  return ctx
}

function getClientIP(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  if (!ip) {
    console.warn('[Auth] No IP address found in request headers. All anonymous users will share one rate-limit bucket.')
    return 'anonymous'
  }

  return ip
}
