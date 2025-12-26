import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { StoryUpdate, Story } from '@/lib/supabase/types'
import { classifyStory, calculateSentimentScore, extractTags } from '@/lib/services/themeClassifier'

export const runtime = 'nodejs'

interface UpdateStoryRequest {
  title?: string
  content?: string
  narrative_prose?: string
  chapter?: string
  tags?: string[]
  is_published?: boolean
  reclassify?: boolean
}

// GET /api/stories/[id] - Get a single story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const story = data as Story

    // Check ownership (RLS should handle this, but double-check)
    if (story.user_id !== user.id) {
      // Check if user has family access to this story
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: familyAccess } = await (supabase as any)
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const familyGroupIds = (familyAccess as { family_group_id: string }[] | null)?.map(f => f.family_group_id) || []

      if (!story.is_published || familyGroupIds.length === 0) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Story GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/stories/[id] - Update a story
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingData, error: fetchError } = await (supabase as any)
      .from('stories')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingData) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const existingStory = existingData as { user_id: string }

    if (existingStory.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body: UpdateStoryRequest = await request.json()
    const { reclassify, ...updateFields } = body

    const updateData: StoryUpdate = { ...updateFields }

    // Reclassify if content changed and reclassify is requested
    if (updateData.content && reclassify) {
      const classification = classifyStory(updateData.content)
      updateData.chapter = classification.chapter
      updateData.tags = extractTags(updateData.content)
      updateData.sentiment_score = calculateSentimentScore(updateData.content)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: story, error } = await (supabase as any)
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating story:', error)
      return NextResponse.json(
        { error: 'Failed to update story' },
        { status: 500 }
      )
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Story PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/stories/[id] - Delete a story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingData2, error: fetchError } = await (supabase as any)
      .from('stories')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingData2) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const existingStoryForDelete = existingData2 as { user_id: string }

    if (existingStoryForDelete.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('stories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting story:', error)
      return NextResponse.json(
        { error: 'Failed to delete story' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Story DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
