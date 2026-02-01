import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Message } from '@/types'

export const runtime = 'nodejs'

interface DraftData {
  messages: Message[]
}

// GET /api/drafts - Get user's current draft
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('embers_drafts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching draft:', error)
      return NextResponse.json(
        { error: 'Failed to fetch draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({ draft: draft || null })
  } catch (error) {
    console.error('Drafts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/drafts - Save/update user's draft (upsert)
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

    const body: DraftData = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Upsert the draft (each user has at most one draft)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('embers_drafts')
      .upsert({
        user_id: user.id,
        messages,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving draft:', error)
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Drafts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/drafts - Delete user's draft
export async function DELETE() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('embers_drafts')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting draft:', error)
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drafts DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
