import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/family/invite/[familyId] - Public endpoint for guest submission page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params

    if (!familyId) {
      return NextResponse.json(
        { error: 'Invalid invite link.' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS since this is a public endpoint
    let supabase
    try {
      supabase = getSupabaseAdminClient()
    } catch (err) {
      console.error('[FamilyInvite] CRITICAL: Admin client unavailable. SUPABASE_SERVICE_ROLE_KEY may be missing.', err)
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Look up family group by invite_code
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, name, owner_id')
      .eq('invite_code', familyId)
      .single()

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found.' },
        { status: 404 }
      )
    }

    // Look up the storyteller — return ONLY first name for privacy
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('name')
      .eq('id', familyGroup.owner_id)
      .single()

    if (ownerError || !owner) {
      return NextResponse.json(
        { error: 'Family group not found.' },
        { status: 404 }
      )
    }

    // Extract first name only
    const storytellerName = owner.name
      ? owner.name.split(' ')[0]
      : 'Your Storyteller'

    // Count pending prompts for queue status
    const { count: promptCount, error: countError } = await supabase
      .from('embers_family_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'pending')

    if (countError) {
      console.error('[FamilyInvite] Error counting prompts:', countError)
    }

    return NextResponse.json({
      familyGroupId: familyGroup.id,
      storytellerName,
      familyName: familyGroup.name,
      promptCount: promptCount || 0,
    })
  } catch (error) {
    console.error('[FamilyInvite] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
