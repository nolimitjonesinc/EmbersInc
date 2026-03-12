import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/getAuthContext'

export const runtime = 'nodejs'

const VALID_STATUSES = ['answered', 'skipped', 'declined'] as const

// PATCH /api/family/prompts/[id] - Update prompt status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { id } = await params

    const body = await request.json()
    const { status, storyId } = body

    // --- Validation ---
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: answered, skipped, declined.' },
        { status: 400 }
      )
    }

    if (status === 'answered' && !storyId) {
      return NextResponse.json(
        { error: 'Story ID is required when marking a prompt as answered.' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Update the prompt, ensuring the authenticated user is the target
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status }
    if (storyId) {
      updateData.story_id = storyId
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prompt, error } = await (supabase as any)
      .from('embers_family_prompts')
      .update(updateData)
      .eq('id', id)
      .eq('target_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[FamilyPrompts] Error updating prompt:', error)
      // Could be no rows matched (wrong user or bad id)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Prompt not found.' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update prompt.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('[FamilyPrompts] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
