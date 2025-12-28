'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { chapters, getChapter } from '@/lib/utils/chapters'
import { ChapterType } from '@/types'

interface Story {
  id: string
  title: string
  content: string
  narrative_prose?: string
  chapter: ChapterType
  tags: string[]
  sentiment_score?: number
  created_at: string
  updated_at: string
}

export default function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit form state
  const [title, setTitle] = useState('')
  const [narrativeProse, setNarrativeProse] = useState('')
  const [selectedChapter, setSelectedChapter] = useState<ChapterType>('who-i-am')
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Load story on mount
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/stories/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Story not found')
          } else if (response.status === 401) {
            router.push('/login')
          } else {
            setError('Failed to load story')
          }
          return
        }
        const data = await response.json()
        setStory(data.story)
        setTitle(data.story.title)
        setNarrativeProse(data.story.narrative_prose || data.story.content)
        setSelectedChapter(data.story.chapter)
      } catch {
        setError('Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStory()
  }, [id, router])

  const handleSave = async () => {
    if (!story) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          narrative_prose: narrativeProse,
          chapter: selectedChapter,
          reclassify: false // Don't reclassify when manually editing
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      const data = await response.json()
      setStory(data.story)
      setSuccessMessage('Story saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setError('Failed to save story. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateNarrative = async () => {
    if (!story) return

    setIsRegenerating(true)
    setError(null)

    try {
      // Call the narrative generator API
      const response = await fetch('/api/ghostwriter/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: story.content,
          style: 'memoir',
          regenerate: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate')
      }

      const data = await response.json()
      if (data.polished) {
        setNarrativeProse(data.polished)
        setSuccessMessage('Narrative regenerated! Review and save when ready.')
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    } catch {
      setError('Failed to regenerate narrative. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0908] flex items-center justify-center">
        <div className="text-[#f9f7f2]/40 font-serif">Loading story...</div>
      </div>
    )
  }

  if (error && !story) {
    return (
      <div className="min-h-screen bg-[#0a0908] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error}</div>
        <Link href="/life-book" className="text-[#E86D48] hover:underline">
          ← Back to Life Book
        </Link>
      </div>
    )
  }

  const currentChapter = getChapter(selectedChapter)

  return (
    <div className="min-h-screen bg-[#0a0908]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0908]/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/life-book"
            className="text-[#f9f7f2]/50 hover:text-[#f9f7f2]/80 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Life Book
          </Link>

          <div className="flex items-center gap-3">
            {successMessage && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-green-400 text-sm"
              >
                {successMessage}
              </motion.span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-full text-sm text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title input */}
          <div className="mb-8">
            <label className="block text-sm text-[#f9f7f2]/40 mb-2">Story Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-serif bg-transparent border-b border-white/10 pb-2 text-[#f9f7f2] placeholder:text-[#f9f7f2]/20 focus:outline-none focus:border-[#E86D48]/50"
              placeholder="Enter a title..."
            />
          </div>

          {/* Chapter selector */}
          <div className="mb-8">
            <label className="block text-sm text-[#f9f7f2]/40 mb-3">Chapter</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedChapter === chapter.id
                      ? 'border-2'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{
                    borderColor: selectedChapter === chapter.id ? chapter.color : undefined,
                    backgroundColor: selectedChapter === chapter.id ? `${chapter.color}15` : undefined
                  }}
                >
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: selectedChapter === chapter.id ? chapter.color : '#f9f7f2' }}
                  >
                    {chapter.title}
                  </div>
                  <div className="text-xs text-[#f9f7f2]/40 line-clamp-2">
                    {chapter.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Narrative editor */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-[#f9f7f2]/40">Story Narrative</label>
              <button
                onClick={handleRegenerateNarrative}
                disabled={isRegenerating}
                className="text-xs px-3 py-1.5 rounded-full border border-[#E86D48]/30 text-[#E86D48]/80 hover:bg-[#E86D48]/10 disabled:opacity-50"
              >
                {isRegenerating ? 'Regenerating...' : '✨ Regenerate Narrative'}
              </button>
            </div>

            <div
              className="relative rounded-2xl border border-white/10 overflow-hidden"
              style={{ backgroundColor: currentChapter ? `${currentChapter.color}05` : undefined }}
            >
              <textarea
                value={narrativeProse}
                onChange={(e) => setNarrativeProse(e.target.value)}
                rows={15}
                className="w-full bg-transparent p-6 text-[#f9f7f2]/90 font-serif text-lg leading-relaxed resize-none focus:outline-none placeholder:text-[#f9f7f2]/20"
                placeholder="Write your story..."
              />

              {/* Word count */}
              <div className="absolute bottom-3 right-4 text-xs text-[#f9f7f2]/30">
                {narrativeProse.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </div>

          {/* Original content (collapsed) */}
          {story?.content && story.content !== narrativeProse && (
            <details className="mb-8">
              <summary className="text-sm text-[#f9f7f2]/40 cursor-pointer hover:text-[#f9f7f2]/60">
                View original conversation
              </summary>
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm text-[#f9f7f2]/60 whitespace-pre-wrap font-mono">
                  {story.content}
                </p>
              </div>
            </details>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-6 text-sm text-[#f9f7f2]/40">
            <div>
              Created: {story && new Date(story.created_at).toLocaleDateString()}
            </div>
            <div>
              Last updated: {story && new Date(story.updated_at).toLocaleDateString()}
            </div>
            {story?.tags && story.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Tags:</span>
                <div className="flex gap-1">
                  {story.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs bg-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
