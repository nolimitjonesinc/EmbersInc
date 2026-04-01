import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { requireAuth } from '@/lib/auth/getAuthContext'
import { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'

interface ElderData {
  userId: string
  name: string
  email: string | null
  lastActivity: string | null
  storyCount: number
  relationship: string | null
}

interface DashboardData {
  familyGroups: Array<{
    id: string
    name: string
    role: string
    elders: ElderData[]
    pendingPromptsCount: number
    inviteCode: string | null
  }>
}

/**
 * GET /api/family/dashboard
 *
 * Returns family circle dashboard data for the authenticated user.
 * Includes elders in their family groups, story counts, activity, and prompt status.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Create authenticated Supabase client from request cookies
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

    // Find all family groups where user is owner or active member
    const { data: memberRecords, error: memberError } = await supabase
      .from('embers_family_members')
      .select('family_group_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (memberError) {
      console.error('[FamilyDashboard] Error fetching member records:', memberError)
      return NextResponse.json(
        { error: 'Failed to load family data.' },
        { status: 500 }
      )
    }

    if (!memberRecords || memberRecords.length === 0) {
      return NextResponse.json<DashboardData>({ familyGroups: [] })
    }

    const familyGroupIds = memberRecords.map(m => m.family_group_id)

    // Fetch family groups
    const { data: familyGroups, error: groupsError } = await supabase
      .from('family_groups')
      .select('id, name, owner_id, invite_code')
      .in('id', familyGroupIds)

    if (groupsError) {
      console.error('[FamilyDashboard] Error fetching family groups:', groupsError)
      return NextResponse.json(
        { error: 'Failed to load family groups.' },
        { status: 500 }
      )
    }

    // For each family group, fetch members, story counts, and prompts
    const dashboardData: DashboardData = {
      familyGroups: []
    }

    for (const group of familyGroups || []) {
      const userRole = memberRecords.find(m => m.family_group_id === group.id)?.role || 'member'

      // Fetch all active members in this group
      const { data: members, error: membersError } = await supabase
        .from('embers_family_members')
        .select('user_id, email, relationship')
        .eq('family_group_id', group.id)
        .eq('status', 'active')

      if (membersError) {
        console.error('[FamilyDashboard] Error fetching group members:', membersError)
        continue
      }

      // Get user details for each member
      const elderData: ElderData[] = []

      for (const member of members || []) {
        if (!member.user_id) continue // Skip pending invites

        // Fetch user profile
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', member.user_id)
          .single()

        if (!userProfile) continue

        // Count published stories for this elder
        const { count: storyCount } = await supabase
          .from('embers_stories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.user_id)
          .eq('is_published', true)

        // Get most recent story timestamp
        const { data: recentStory } = await supabase
          .from('embers_stories')
          .select('created_at')
          .eq('user_id', member.user_id)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        elderData.push({
          userId: userProfile.id,
          name: userProfile.name || userProfile.email || 'Unknown',
          email: userProfile.email,
          lastActivity: recentStory?.created_at || null,
          storyCount: storyCount || 0,
          relationship: member.relationship
        })
      }

      // Count pending prompts for this family group
      const { count: pendingCount } = await supabase
        .from('embers_family_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('family_group_id', group.id)
        .eq('status', 'pending')

      dashboardData.familyGroups.push({
        id: group.id,
        name: group.name,
        role: userRole,
        elders: elderData,
        pendingPromptsCount: pendingCount || 0,
        inviteCode: group.invite_code
      })
    }

    return NextResponse.json<DashboardData>(dashboardData)
  } catch (error) {
    console.error('[FamilyDashboard] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
