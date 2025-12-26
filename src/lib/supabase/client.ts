'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (supabase) {
    return supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabase
}

// Alias for convenience
export const createClient = getSupabaseBrowserClient
