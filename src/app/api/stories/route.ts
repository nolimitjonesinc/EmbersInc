import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { classifyStory, calculateSentimentScore, extractTags } from '@/lib/services/themeClassifier'
import { generateNarrativeProse, generateStoryTitle } from '@/lib/services/narrativeGenerator'
import { StoryInsert, Story } from '@/lib/supabase/types'
import { Message } from '@/types'

export const runtime = 'nodejs'

interface CreateStoryRequest {
  content: string
  messages?: Message[]
  title?: string
  chapter?: string
  generateNarrative?: boolean
  generateTitle?: boolean
}

// GET /api/stories - List user's stories
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const chapter = searchParams.get('chapter')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (chapter) {
      query = query.eq('chapter', chapter)
    }

    const { data: stories, error } = await query

    if (error) {
      console.error('Error fetching stories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Stories GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateStoryRequest = await request.json()
    const {
      content,
      messages,
      title: providedTitle,
      chapter: providedChapter,
      generateNarrative = true,
      generateTitle = true
    } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Classify the story to determine chapter and tags
    const classification = classifyStory(content)
    const sentimentScore = calculateSentimentScore(content)
    const tags = extractTags(content)

    // Use provided chapter or classified chapter
    const chapter = providedChapter || classification.chapter

    // Generate title if requested and not provided
    let title = providedTitle
    if (!title && generateTitle) {
      try {
        title = await generateStoryTitle(content)
      } catch (e) {
        console.error('Error generating title:', e)
        title = 'Untitled Story'
      }
    }
    title = title || 'Untitled Story'

    // Generate narrative prose if requested and messages provided
    let narrativeProse: string | null = null
    if (generateNarrative && messages && messages.length > 0) {
      try {
        narrativeProse = await generateNarrativeProse(messages)
      } catch (e) {
        console.error('Error generating narrative:', e)
      }
    }

    // Create the story
    const storyData: StoryInsert = {
      user_id: user.id,
      title,
      content,
      narrative_prose: narrativeProse,
      chapter,
      tags,
      sentiment_score: sentimentScore,
      is_published: false,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: story, error } = await (supabase as any)
      .from('stories')
      .insert(storyData)
      .select()
      .single()

    if (error) {
      console.error('Error creating story:', error)
      return NextResponse.json(
        { error: 'Failed to create story' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      story,
      classification: {
        chapter: classification.chapter,
        confidence: classification.confidence,
        sentiment: classification.sentiment
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Stories POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
