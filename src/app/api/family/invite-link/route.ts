import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/getAuthContext'
import { generateInviteCode } from '@/lib/utils/inviteCode'

export const runtime = 'nodejs'

// GET /api/family/invite-link - Get or create invite link for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const supabase = await getSupabaseServerClient()

    // Check if user already owns a family group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingGroup, error: fetchError } = await (supabase as any)
      .from('family_groups')
      .select('id, name, invite_code')
      .eq('owner_id', user.id)
      .limit(1)
      .single()

    // If they have a group
    if (existingGroup && !fetchError) {
      // If it already has an invite code, return it
      if (existingGroup.invite_code) {
        return NextResponse.json({
          inviteCode: existingGroup.invite_code,
          familyGroupId: existingGroup.id,
        })
      }

      // Generate an invite code and update the group
      const inviteCode = generateInviteCode()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('family_groups')
        .update({ invite_code: inviteCode })
        .eq('id', existingGroup.id)
        .eq('owner_id', user.id)

      if (updateError) {
        console.error('[InviteLink] Error updating invite code:', updateError)
        return NextResponse.json(
          { error: 'Failed to generate invite link.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        inviteCode,
        familyGroupId: existingGroup.id,
      })
    }

    // No family group exists — create one
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'My'
    const firstName = String(userName).split(' ')[0]
    const inviteCode = generateInviteCode()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newGroup, error: createError } = await (supabase as any)
      .from('family_groups')
      .insert({
        name: `${firstName}'s Family`,
        owner_id: user.id,
        invite_code: inviteCode,
      })
      .select('id')
      .single()

    if (createError || !newGroup) {
      console.error('[InviteLink] Error creating family group:', createError)
      return NextResponse.json(
        { error: 'Failed to create family group.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      inviteCode,
      familyGroupId: newGroup.id,
    })
  } catch (error) {
    console.error('[InviteLink] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
