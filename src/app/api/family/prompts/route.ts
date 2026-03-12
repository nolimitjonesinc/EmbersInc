import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/getAuthContext'
import { checkRateLimit } from '@/lib/auth/rateLimit'

export const runtime = 'nodejs'

const VALID_RELATIONSHIPS = [
  'daughter', 'son', 'granddaughter', 'grandson', 'niece', 'nephew',
  'friend', 'spouse', 'sibling', 'other',
  // Also accept lowercase/generic forms
  'child', 'grandchild', 'parent', 'grandparent', 'cousin', 'in-law',
]

/**
 * Strip HTML/script tags and control characters from input.
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}

// POST /api/family/prompts - Submit a family prompt (guest or authenticated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { familyGroupId, submitterName, submitterRelationship, content, submitterEmail } = body

    // --- Validation ---
    if (!familyGroupId || !submitterName || !submitterRelationship || !content) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    const cleanName = sanitizeInput(String(submitterName))
    const cleanContent = sanitizeInput(String(content))

    if (cleanName.length === 0 || cleanName.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 100 characters.' },
        { status: 400 }
      )
    }

    if (cleanContent.length === 0 || cleanContent.length > 500) {
      return NextResponse.json(
        { error: 'Question must be between 1 and 500 characters.' },
        { status: 400 }
      )
    }

    if (!VALID_RELATIONSHIPS.includes(submitterRelationship.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid relationship type.' },
        { status: 400 }
      )
    }

    // --- Rate limiting (IP-based, 5 per hour) ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    const rateLimitKey = `family-prompt:${ip}`
    const rateCheck = checkRateLimit(rateLimitKey, false)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'You have submitted too many questions. Please try again later.' },
        { status: 429 }
      )
    }

    // --- Look up family group to get target_user_id ---
    // Use admin client to bypass RLS since guests aren't authenticated
    let supabaseAdmin
    try {
      supabaseAdmin = getSupabaseAdminClient()
    } catch (err) {
      console.error('[FamilyPrompts] CRITICAL: Admin client unavailable. SUPABASE_SERVICE_ROLE_KEY may be missing.', err)
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const { data: familyGroup, error: groupError } = await supabaseAdmin
      .from('family_groups')
      .select('id, owner_id')
      .eq('id', familyGroupId)
      .single()

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found.' },
        { status: 404 }
      )
    }

    // --- Insert the prompt ---
    const { error: insertError } = await supabaseAdmin
      .from('embers_family_prompts')
      .insert({
        family_group_id: familyGroupId,
        target_user_id: familyGroup.owner_id,
        submitter_name: cleanName,
        submitter_relationship: submitterRelationship,
        submitter_email: submitterEmail ? sanitizeInput(String(submitterEmail)) : null,
        content: cleanContent,
        type: 'question',
        status: 'pending',
        offered_count: 0,
      })

    if (insertError) {
      console.error('[FamilyPrompts] Error inserting prompt:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit question.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Your question has been sent!' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[FamilyPrompts] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/family/prompts - Fetch next pending prompt for storyteller (auth required)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const supabase = await getSupabaseServerClient()

    // Fetch the oldest pending prompt for this storyteller
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prompt, error } = await (supabase as any)
      .from('embers_family_prompts')
      .select('*')
      .eq('target_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('[FamilyPrompts] Error fetching prompt:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts.' },
        { status: 500 }
      )
    }

    if (!prompt) {
      return NextResponse.json({ prompt: null })
    }

    // Update status to 'offered' and increment offered_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('embers_family_prompts')
      .update({
        status: 'offered',
        offered_count: (prompt.offered_count || 0) + 1,
      })
      .eq('id', prompt.id)
      .eq('target_user_id', user.id)

    if (updateError) {
      console.error('[FamilyPrompts] Error updating prompt status:', updateError)
      // Still return the prompt even if status update fails
    }

    return NextResponse.json({
      prompt: {
        ...prompt,
        status: 'offered',
        offered_count: (prompt.offered_count || 0) + 1,
      },
    })
  } catch (error) {
    console.error('[FamilyPrompts] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
