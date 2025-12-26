// Re-export all Supabase utilities
export * from './types'
export { getSupabaseBrowserClient, createClient as createBrowserClient } from './client'
export { getSupabaseServerClient, getSupabaseAdminClient, createClient as createServerClient } from './server'
export { updateSession, protectedRoutes, publicRoutes, isProtectedRoute, isPublicRoute } from './middleware'
