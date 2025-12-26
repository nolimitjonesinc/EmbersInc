'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface PhotoAnalysis {
  analysis: string
  tags: string[]
  estimatedEra: string | null
}

interface Message {
  role: 'assistant' | 'user'
  content: string
}

export default function PhotoDetectivePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setSelectedImage(base64)
      setAnalysis(null)
      setMessages([])

      // Analyze the photo
      await analyzePhoto(base64)
    }
    reader.readAsDataURL(file)
  }

  const analyzePhoto = async (imageBase64: string) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/photos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data: PhotoAnalysis = await response.json()
      setAnalysis(data)
      setMessages([{ role: 'assistant', content: data.analysis }])
    } catch (error) {
      console.error('Photo analysis error:', error)
      setMessages([{
        role: 'assistant',
        content: "I'm sorry, I had trouble analyzing this photo. Could you try uploading it again?"
      }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedImage) return

    const userMessage = inputText.trim()
    setInputText('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsResponding(true)

    try {
      // Build context from conversation
      const context = messages.map(m => `${m.role}: ${m.content}`).join('\n')

      const response = await fetch('/api/photos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          previousContext: context + `\nuser: ${userMessage}`,
        }),
      })

      if (!response.ok) throw new Error('Response failed')

      const data: PhotoAnalysis = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.analysis }])
    } catch (error) {
      console.error('Response error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, something went wrong. Could you try again?"
      }])
    } finally {
      setIsResponding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSaveAsStory = async () => {
    if (messages.length === 0) return

    // Combine the conversation into a story
    const storyContent = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n')

    if (!storyContent.trim()) {
      alert('Share some memories first before saving!')
      return
    }

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: storyContent,
          messages: messages.map((m, i) => ({
            id: i.toString(),
            role: m.role,
            content: m.content,
            timestamp: new Date(),
          })),
          generateNarrative: true,
          generateTitle: true,
        }),
      })

      if (response.ok) {
        alert('Story saved successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save story')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save story')
    }
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
            <Link href="/timeline" className="text-gray-600 hover:text-ember-orange transition-colors">
              Timeline
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            🔍 Photo Detective
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload an old photo and let me help you unlock the memories hidden within it.
          </p>
        </div>

        {/* Upload area */}
        {!selectedImage && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-ember-orange hover:bg-amber-50/50 transition-all"
              >
                <span className="text-6xl block mb-4">📸</span>
                <h3 className="text-xl font-semibold mb-2">Drop a photo here</h3>
                <p className="text-gray-600 mb-4">
                  or click to select from your device
                </p>
                <p className="text-sm text-gray-400">
                  Supports JPG, PNG, HEIC up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Photo and conversation */}
        {selectedImage && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo display */}
            <div>
              <Card className="overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={selectedImage}
                    alt="Uploaded photo"
                    fill
                    className="object-contain bg-gray-100"
                  />
                </div>
                <CardContent className="p-4">
                  {analysis?.estimatedEra && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">Estimated era:</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        {analysis.estimatedEra}
                      </span>
                    </div>
                  )}
                  {analysis?.tags && analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null)
                        setAnalysis(null)
                        setMessages([])
                      }}
                    >
                      Upload Different Photo
                    </Button>
                    {messages.length > 1 && (
                      <Button size="sm" onClick={handleSaveAsStory}>
                        💾 Save as Story
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation */}
            <div className="flex flex-col h-[600px]">
              <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isAnalyzing && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="animate-spin w-5 h-5 border-2 border-ember-orange border-t-transparent rounded-full"></div>
                      <span>Looking at your photo...</span>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`${
                        message.role === 'assistant'
                          ? 'bg-gray-100 rounded-2xl rounded-tl-sm'
                          : 'bg-ember-gradient/20 rounded-2xl rounded-tr-sm ml-auto'
                      } p-4 max-w-[90%]`}
                    >
                      <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}

                  {isResponding && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-ember-orange rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share a memory about this photo..."
                      disabled={isAnalyzing || isResponding}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isResponding}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tips */}
        {!selectedImage && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <span className="text-3xl block mb-3">👨‍👩‍👧‍👦</span>
                <h3 className="font-semibold mb-2">Family Photos</h3>
                <p className="text-sm text-gray-600">
                  I can help identify clothing styles, settings, and ask about relationships
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <span className="text-3xl block mb-3">🎉</span>
                <h3 className="font-semibold mb-2">Special Occasions</h3>
                <p className="text-sm text-gray-600">
                  Weddings, birthdays, holidays - I'll spot the details and ask the right questions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <span className="text-3xl block mb-3">🏠</span>
                <h3 className="font-semibold mb-2">Places & Moments</h3>
                <p className="text-sm text-gray-600">
                  Old houses, neighborhoods, vacations - every place has a story
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
