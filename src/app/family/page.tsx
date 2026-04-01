'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ElderData {
  userId: string
  name: string
  email: string | null
  lastActivity: string | null
  storyCount: number
  relationship: string | null
}

interface FamilyGroup {
  id: string
  name: string
  role: string
  elders: ElderData[]
  pendingPromptsCount: number
  inviteCode: string | null
}

interface DashboardData {
  familyGroups: FamilyGroup[]
}

export default function FamilyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [newPrompt, setNewPrompt] = useState<{ [key: string]: string }>({})
  const [submittingPrompt, setSubmittingPrompt] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/family/dashboard')
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?redirect=/family'
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError('Failed to load family dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteLink = (groupId: string, inviteCode: string | null) => {
    if (!inviteCode) return
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/ask/${groupId}?code=${inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedCode(groupId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const regenerateInvite = async (groupId: string) => {
    setRegeneratingId(groupId)
    try {
      const response = await fetch('/api/family/regenerate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyGroupId: groupId })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate invite')
      }

      await fetchDashboard() // Refresh to show new code
    } catch (err) {
      console.error('Error regenerating invite:', err)
      alert('Failed to regenerate invite link')
    } finally {
      setRegeneratingId(null)
    }
  }

  const submitPrompt = async (groupId: string, targetUserId: string) => {
    const promptText = newPrompt[targetUserId]?.trim()
    if (!promptText) return

    setSubmittingPrompt(targetUserId)
    try {
      const response = await fetch('/api/family/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyGroupId: groupId,
          submitterName: 'Family Member', // Could fetch from user profile
          submitterRelationship: 'family',
          content: promptText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit prompt')
      }

      setNewPrompt({ ...newPrompt, [targetUserId]: '' })
      await fetchDashboard() // Refresh pending count
    } catch (err) {
      console.error('Error submitting prompt:', err)
      alert('Failed to send question')
    } finally {
      setSubmittingPrompt(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1714] text-[#f9f7f2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E86D48] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#f9f7f2]/70">Loading your family circle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1714] text-[#f9f7f2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#E86D48] rounded-full hover:bg-[#c45a3a] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const noFamilyGroups = !data || data.familyGroups.length === 0

  return (
    <div className="min-h-screen bg-[#1a1714] text-[#f9f7f2]">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1714]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 12px 3px rgba(232, 109, 72, 0.4)',
              }}
            />
            <span className="text-xl font-serif">Embers</span>
          </Link>
          <Link
            href="/stories"
            className="text-[#f9f7f2]/50 hover:text-[#f9f7f2] transition-colors text-sm"
          >
            Stories
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif mb-2 text-[#f9f7f2]">Your Family Circle</h1>
        <p className="text-[#f9f7f2]/70 mb-12">
          Stay connected with your loved ones and their memories
        </p>

        {noFamilyGroups ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 20px 5px rgba(232, 109, 72, 0.3)',
              }}
            />
            <h2 className="text-2xl font-serif mb-3">Set up Embers for someone you love</h2>
            <p className="text-[#f9f7f2]/70 mb-8 max-w-md mx-auto">
              Create a family circle to help preserve memories for a parent, grandparent, or loved one.
            </p>
            <Link
              href="/family/setup"
              className="inline-block px-6 py-3 bg-[#E86D48] rounded-full hover:bg-[#c45a3a] transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {data.familyGroups.map((group) => (
              <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif text-[#f9f7f2]">{group.name}</h2>
                  <span className="text-xs text-[#f9f7f2]/50 px-3 py-1 bg-white/5 rounded-full">
                    {group.role}
                  </span>
                </div>

                {/* Elder Cards */}
                <div className="space-y-4 mb-6">
                  {group.elders.map((elder) => (
                    <div
                      key={elder.userId}
                      className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-[#E86D48]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-[#f9f7f2] mb-1">
                            {elder.name}
                          </h3>
                          {elder.relationship && (
                            <p className="text-sm text-[#f9f7f2]/50 capitalize">
                              {elder.relationship}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              elder.storyCount > 0 ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                            title={elder.storyCount > 0 ? 'Backed up' : 'No stories yet'}
                          />
                          <span className="text-sm text-[#f9f7f2]/70">
                            {elder.storyCount} {elder.storyCount === 1 ? 'memory' : 'memories'}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#f9f7f2]/60 mb-4">
                        {elder.lastActivity
                          ? `Last shared ${formatDistanceToNow(new Date(elder.lastActivity))} ago`
                          : "Hasn't shared a memory yet"}
                      </p>

                      {elder.storyCount > 0 && (
                        <Link
                          href={`/stories?user=${elder.userId}`}
                          className="text-sm text-[#E86D48] hover:text-[#f4a574] transition-colors"
                        >
                          View stories →
                        </Link>
                      )}

                      {/* Suggest a Prompt */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <label className="text-sm text-[#f9f7f2]/70 block mb-2">
                          Suggest a question for {elder.name.split(' ')[0]}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPrompt[elder.userId] || ''}
                            onChange={(e) =>
                              setNewPrompt({ ...newPrompt, [elder.userId]: e.target.value })
                            }
                            placeholder="What would you like to ask?"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[#f9f7f2] placeholder:text-[#f9f7f2]/30 focus:outline-none focus:border-[#E86D48]/50"
                            disabled={submittingPrompt === elder.userId}
                          />
                          <button
                            onClick={() => submitPrompt(group.id, elder.userId)}
                            disabled={
                              !newPrompt[elder.userId]?.trim() || submittingPrompt === elder.userId
                            }
                            className="px-4 py-2 bg-[#E86D48] text-white rounded-lg hover:bg-[#c45a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {submittingPrompt === elder.userId ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Prompts */}
                {group.pendingPromptsCount > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-200">
                      {group.pendingPromptsCount} pending{' '}
                      {group.pendingPromptsCount === 1 ? 'question' : 'questions'} waiting to be
                      answered
                    </p>
                  </div>
                )}

                {/* Invite Section */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-medium text-[#f9f7f2] mb-3">Share with Family</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => copyInviteLink(group.id, group.inviteCode)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-[#E86D48]/50 transition-colors text-sm text-[#f9f7f2]"
                    >
                      {copiedCode === group.id ? 'Copied!' : 'Copy Invite Link'}
                    </button>
                    <button
                      onClick={() => regenerateInvite(group.id)}
                      disabled={regeneratingId === group.id}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-[#E86D48]/50 transition-colors text-sm text-[#f9f7f2] disabled:opacity-50"
                    >
                      {regeneratingId === group.id ? 'Generating...' : 'New Link'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
