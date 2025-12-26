'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChapterType } from '@/types'
import { chapters } from '@/lib/utils/chapters'
import { extractDates, estimateStoryPeriod } from '@/lib/utils/dateExtractor'

interface ApiStory {
  id: string
  user_id: string
  title: string
  content: string
  narrative_prose?: string
  chapter: ChapterType
  tags: string[]
  created_at: string
}

interface TimelineItem {
  story: ApiStory
  year?: number
  decade?: number
  era?: string
}

export default function TimelinePage() {
  const [stories, setStories] = useState<ApiStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)

  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name')
    if (storedName) setUserName(storedName)

    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories')
        if (response.ok) {
          const data = await response.json()
          setStories(data.stories || [])
        }
      } catch (err) {
        console.error('Error fetching stories:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

  // Process stories into timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []

    stories.forEach(story => {
      const period = estimateStoryPeriod(story.content)
      items.push({
        story,
        year: period.start,
        decade: period.start ? Math.floor(period.start / 10) * 10 : undefined,
        era: period.era
      })
    })

    // Sort by year/decade
    return items.sort((a, b) => {
      const yearA = a.year || a.decade || 9999
      const yearB = b.year || b.decade || 9999
      return yearA - yearB
    })
  }, [stories])

  // Get unique decades for filtering
  const decades = useMemo(() => {
    const decadeSet = new Set<number>()
    timelineItems.forEach(item => {
      if (item.decade) decadeSet.add(item.decade)
    })
    return Array.from(decadeSet).sort((a, b) => a - b)
  }, [timelineItems])

  // Items without dates
  const undatedItems = timelineItems.filter(item => !item.year && !item.decade)
  const datedItems = timelineItems.filter(item => item.year || item.decade)

  // Filter by selected decade
  const filteredItems = selectedDecade
    ? datedItems.filter(item => item.decade === selectedDecade)
    : datedItems

  // Identify gaps in the timeline
  const gaps = useMemo(() => {
    const gapDecades: number[] = []
    if (decades.length >= 2) {
      for (let i = 0; i < decades.length - 1; i++) {
        const current = decades[i]
        const next = decades[i + 1]
        // If there's a gap of more than 10 years
        if (next - current > 10) {
          for (let d = current + 10; d < next; d += 10) {
            gapDecades.push(d)
          }
        }
      }
    }
    return gapDecades
  }, [decades])

  const getChapterInfo = (chapterId: ChapterType) => {
    return chapters.find(c => c.id === chapterId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold text-ember-gradient">Embers</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/stories" className="text-gray-600 hover:text-ember-orange transition-colors">
              Stories
            </Link>
            <Link href="/life-book" className="text-gray-600 hover:text-ember-orange transition-colors">
              Life Book
            </Link>
            <Button asChild>
              <Link href="/conversation">+ New Story</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            📅 {userName ? `${userName}'s` : 'My'} Timeline
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your life stories mapped across time. See how your memories connect through the decades.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-ember-orange border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your timeline...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">📅</span>
            <h2 className="text-2xl font-bold mb-2">No stories yet</h2>
            <p className="text-gray-600 mb-6">
              Start sharing your memories and watch your timeline come to life.
            </p>
            <Button asChild size="lg">
              <Link href="/conversation">Share Your First Story</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Decade filter */}
            {decades.length > 0 && (
              <div className="mb-8 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => setSelectedDecade(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedDecade === null
                        ? 'bg-ember-orange text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Decades
                  </button>
                  {decades.map(decade => (
                    <button
                      key={decade}
                      onClick={() => setSelectedDecade(decade)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedDecade === decade
                          ? 'bg-ember-orange text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {decade}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline visualization */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-orange-400 to-red-400 transform md:-translate-x-1/2"></div>

              {/* Timeline items */}
              <div className="space-y-8">
                {filteredItems.map((item, index) => {
                  const chapterInfo = getChapterInfo(item.story.chapter)
                  const isEven = index % 2 === 0

                  return (
                    <div
                      key={item.story.id}
                      className={`relative flex items-start ${
                        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-ember-orange rounded-full border-4 border-white shadow transform -translate-x-1/2 z-10"></div>

                      {/* Year label */}
                      <div className={`hidden md:block w-1/2 ${isEven ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                        <span className="text-2xl font-bold text-ember-orange">
                          {item.era || (item.decade ? `${item.decade}s` : '?')}
                        </span>
                      </div>

                      {/* Story card */}
                      <div className={`ml-12 md:ml-0 md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            {/* Mobile year */}
                            <div className="md:hidden mb-2">
                              <span className="text-lg font-bold text-ember-orange">
                                {item.era || (item.decade ? `${item.decade}s` : 'Unknown date')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <span>{chapterInfo?.icon}</span>
                              <span>{chapterInfo?.title}</span>
                            </div>

                            <h3 className="text-xl font-semibold mb-2">{item.story.title}</h3>

                            <p className="text-gray-600 line-clamp-3">
                              {item.story.narrative_prose || item.story.content}
                            </p>

                            {item.story.tags && item.story.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {item.story.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Gap indicators */}
              {gaps.length > 0 && selectedDecade === null && (
                <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-200">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>💡</span> Story Sparks
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We noticed some gaps in your timeline. Would you like to fill them in?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {gaps.slice(0, 4).map(decade => (
                      <Button key={decade} variant="outline" asChild>
                        <Link href={`/conversation?decade=${decade}`}>
                          Tell me about the {decade}s →
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Undated stories */}
              {undatedItems.length > 0 && selectedDecade === null && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    📝 Stories without dates ({undatedItems.length})
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {undatedItems.map(item => {
                      const chapterInfo = getChapterInfo(item.story.chapter)
                      return (
                        <Card key={item.story.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <span>{chapterInfo?.icon}</span>
                              <span>{chapterInfo?.title}</span>
                            </div>
                            <h4 className="font-semibold">{item.story.title}</h4>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
