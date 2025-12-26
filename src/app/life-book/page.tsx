'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChapterType } from '@/types';
import { chapters } from '@/lib/utils/chapters';

// Story type matching what we get from the API
interface ApiStory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  narrative_prose?: string;
  chapter: ChapterType;
  tags: string[];
  sentiment_score?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function LifeBookPage() {
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterType | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user name from localStorage
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
    }

    // Fetch stories from API
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories');
        if (!response.ok) {
          if (response.status === 401) {
            setStories([]);
            return;
          }
          throw new Error('Failed to fetch stories');
        }
        const data = await response.json();
        setStories(data.stories || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const getStoriesForChapter = (chapterId: ChapterType) => {
    return stories.filter((s) => s.chapter === chapterId);
  };

  const totalStories = stories.length;

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
            <Link
              href="/stories"
              className="text-gray-600 hover:text-ember-orange transition-colors hidden sm:block"
            >
              All Stories
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
            {userName ? `${userName}'s Life Book` : 'My Life Book'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your stories, organized into seven meaningful chapters. Each chapter captures a different
            part of your journey.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-ember-gradient/10 px-4 py-2 rounded-full">
            <span className="text-ember-orange font-semibold">
              {isLoading ? '...' : totalStories}
            </span>
            <span className="text-gray-600">
              {totalStories === 1 ? 'story' : 'stories'} preserved
            </span>
          </div>
        </div>

        {/* Chapter grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {chapters.map((chapter) => {
            const chapterStories = getStoriesForChapter(chapter.id);
            const storyCount = chapterStories.length;

            return (
              <Card
                key={chapter.id}
                className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
              >
                <CardHeader
                  className="pb-3"
                  style={{
                    background: `linear-gradient(135deg, ${chapter.color}15, ${chapter.color}05)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{chapter.icon}</span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${chapter.color}20`,
                        color: chapter.color,
                      }}
                    >
                      {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  <CardTitle className="text-xl mt-3 group-hover:text-ember-orange transition-colors">
                    {chapter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-600 text-sm mb-4">{chapter.description}</p>

                  {/* Preview of stories */}
                  {storyCount > 0 ? (
                    <div className="space-y-2">
                      {chapterStories.slice(0, 2).map((story) => (
                        <div
                          key={story.id}
                          className="text-sm text-gray-500 truncate flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-ember-orange flex-shrink-0" />
                          {story.title}
                        </div>
                      ))}
                      {storyCount > 2 && (
                        <p className="text-xs text-gray-400">+{storyCount - 2} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No stories yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected chapter detail */}
        {selectedChapter && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 animate-fadeIn">
            {(() => {
              const chapter = chapters.find((c) => c.id === selectedChapter);
              const chapterStories = getStoriesForChapter(selectedChapter);

              if (!chapter) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{chapter.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold">{chapter.title}</h2>
                        <p className="text-gray-600">{chapter.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedChapter(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Prompts */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-700 mb-3">Story Prompts:</h3>
                    <div className="flex flex-wrap gap-2">
                      {chapter.prompts.slice(0, 4).map((prompt, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600"
                        >
                          {prompt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stories in this chapter */}
                  {chapterStories.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">
                        Stories ({chapterStories.length})
                      </h3>
                      {chapterStories.map((story) => (
                        <div
                          key={story.id}
                          className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <h4 className="font-semibold text-lg mb-2">{story.title}</h4>
                          <p className="text-gray-600 line-clamp-2 mb-3">{story.narrative_prose || story.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {(story.tags || []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-500"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(story.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <p className="text-gray-500 mb-4">No stories in this chapter yet.</p>
                      <Button asChild>
                        <Link href="/conversation">Add Your First Story</Link>
                      </Button>
                    </div>
                  )}

                  {/* Add story button */}
                  {chapterStories.length > 0 && (
                    <div className="mt-6 text-center">
                      <Button asChild variant="outline">
                        <Link href="/conversation">Add Another Story to This Chapter</Link>
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {totalStories === 0 && (
          <div className="text-center py-16">
            <span className="text-8xl mb-6 block">📖</span>
            <h2 className="text-3xl font-bold mb-4">Your Life Book Awaits</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              Start sharing your stories and watch your Life Book grow, one memory at a time.
            </p>
            <Button asChild size="lg">
              <Link href="/conversation">Share Your First Story</Link>
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        {totalStories > 0 && (
          <div className="text-center py-12 bg-ember-gradient/5 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Keep Building Your Legacy</h2>
            <p className="text-gray-600 mb-6">
              Every story you share becomes a treasured gift for your family.
            </p>
            <Button asChild size="lg">
              <Link href="/conversation">Add Another Story</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
