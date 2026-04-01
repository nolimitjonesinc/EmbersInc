import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { requireAuth } from '@/lib/auth/getAuthContext'
import { generateInviteCode } from '@/lib/utils/inviteCode'
import { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'

/**
 * POST /api/family/regenerate-invite
 *
 * Regenerates the invite code for a family group.
 * Only the owner can regenerate the invite code.
 *
 * Body: { familyGroupId: string }
 * Returns: { inviteCode: string, inviteUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { familyGroupId } = body

    if (!familyGroupId) {
      return NextResponse.json(
        { error: 'Family group ID is required.' },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Service configuration error.' },
        { status: 503 }
      )
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
      },
    })

    // Verify user is the owner of this family group
    const { data: familyGroup, error: fetchError } = await supabase
      .from('family_groups')
      .select('id, owner_id')
      .eq('id', familyGroupId)
      .single()

    if (fetchError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found.' },
        { status: 404 }
      )
    }

    if (familyGroup.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the family group owner can regenerate the invite link.' },
        { status: 403 }
      )
    }

    // Generate new invite code
    const newInviteCode = generateInviteCode()

    // Update the family group
    const { error: updateError } = await supabase
      .from('family_groups')
      .update({
        invite_code: newInviteCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', familyGroupId)
      .eq('owner_id', user.id) // Extra safety check

    if (updateError) {
      console.error('[RegenerateInvite] Error updating invite code:', updateError)
      return NextResponse.json(
        { error: 'Failed to regenerate invite code.' },
        { status: 500 }
      )
    }

    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/ask/${familyGroupId}?code=${newInviteCode}`

    return NextResponse.json({
      inviteCode: newInviteCode,
      inviteUrl
    })
  } catch (error) {
    console.error('[RegenerateInvite] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
