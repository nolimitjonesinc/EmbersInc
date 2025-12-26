'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEraContent, getAllDecades, EraContent } from '@/data/era-content/decades'

export default function EraPage({ params }: { params: Promise<{ decade: string }> }) {
  const { decade } = use(params)
  const decadeNum = parseInt(decade)
  const era = getEraContent(decadeNum)
  const allDecades = getAllDecades()

  if (!era) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Era not found</h1>
          <Button asChild>
            <Link href="/era/1950">View 1950s</Link>
          </Button>
        </div>
      </div>
    )
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
            <Link href="/timeline" className="text-gray-600 hover:text-ember-orange transition-colors">
              Timeline
            </Link>
            <Button asChild>
              <Link href={`/conversation?decade=${decadeNum}`}>
                Tell a {decadeNum}s Story
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Decade navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {allDecades.map(d => (
              <Link
                key={d}
                href={`/era/${d}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  d === decadeNum
                    ? 'bg-ember-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}s
              </Link>
            ))}
          </div>
        </div>

        {/* Era header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            ✨ {era.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {era.description}
          </p>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Key Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📰</span> Key Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {era.keyEvents.map((event, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-ember-orange mt-1">•</span>
                    <span className="text-gray-700">{event}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Popular Music */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎵</span> Popular Music
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {era.popularMusic.map((song, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">♪</span>
                    <span className="text-gray-700">{song}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Popular TV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📺</span> Popular TV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {era.popularTV.map((show, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{show}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Prices Then */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💰</span> Prices Back Then
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {era.prices.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-600">{item.item}</span>
                    <span className="font-semibold text-green-600">{item.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slang */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💬</span> {decadeNum}s Slang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {era.slang.map((item, i) => (
                  <div key={i}>
                    <span className="font-semibold text-ember-orange">{item.term}</span>
                    <p className="text-sm text-gray-600">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technology */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔧</span> Technology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {era.technology.map((tech, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-gray-700">{tech}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Fashion */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👗</span> Fashion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {era.fashion.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Story prompts */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>💡</span> Story Sparks for the {decadeNum}s
          </h2>
          <p className="text-gray-600 mb-6">
            These prompts might help unlock your memories from this era:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {era.prompts.map((prompt, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <p className="text-gray-700 italic">&ldquo;{prompt}&rdquo;</p>
                  <Button asChild variant="link" className="mt-2 px-0">
                    <Link href={`/conversation?prompt=${encodeURIComponent(prompt)}`}>
                      Tell this story →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-between">
          {decadeNum > 1940 && (
            <Button asChild variant="outline">
              <Link href={`/era/${decadeNum - 10}`}>
                ← {decadeNum - 10}s
              </Link>
            </Button>
          )}
          <div className="flex-1" />
          {decadeNum < 2010 && (
            <Button asChild variant="outline">
              <Link href={`/era/${decadeNum + 10}`}>
                {decadeNum + 10}s →
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
