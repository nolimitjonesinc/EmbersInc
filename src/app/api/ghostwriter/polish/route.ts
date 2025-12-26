import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { polishNarrative, expandStory } from '@/lib/services/narrativeGenerator'

export const runtime = 'nodejs'

interface PolishRequest {
  content: string
  mode: 'polish' | 'expand'
  instructions?: string
  context?: {
    chapter?: string
    era?: string
  }
}

// POST /api/ghostwriter/polish - Polish or expand story prose
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

    const body: PolishRequest = await request.json()
    const { content, mode, instructions, context } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    let result: { original: string; enhanced: string; changes?: string[] }

    if (mode === 'expand') {
      const expanded = await expandStory(content, context)
      result = {
        original: content,
        enhanced: expanded,
      }
    } else {
      const { polished, changes } = await polishNarrative(content, instructions)
      result = {
        original: content,
        enhanced: polished,
        changes,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ghostwriter polish error:', error)
    return NextResponse.json(
      { error: 'Failed to process content' },
      { status: 500 }
    )
  }
}
