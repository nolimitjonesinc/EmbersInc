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

export default function StoriesPage() {
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [filter, setFilter] = useState<ChapterType | 'all'>('all');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            // Not logged in - show empty state
            setStories([]);
            return;
          }
          throw new Error('Failed to fetch stories');
        }
        const data = await response.json();
        setStories(data.stories || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError('Failed to load stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const filteredStories =
    filter === 'all' ? stories : stories.filter((s) => s.chapter === filter);

  const getChapterInfo = (chapterId: ChapterType) => {
    return chapters.find((c) => c.id === chapterId);
  };

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
              href="/life-book"
              className="text-gray-600 hover:text-ember-orange transition-colors hidden sm:block"
            >
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {userName ? `${userName}'s Stories` : 'My Stories'}
          </h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} preserved`}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-100 rounded mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-ember-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Stories
            </button>
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setFilter(chapter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === chapter.id
                    ? 'bg-ember-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chapter.icon} {chapter.title}
              </button>
            ))}
          </div>
        </div>

        {/* Stories grid */}
        {!isLoading && filteredStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const chapterInfo = getChapterInfo(story.chapter);
              return (
                <Card
                  key={story.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span>{chapterInfo?.icon}</span>
                      <span>{chapterInfo?.title}</span>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">
                      {story.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {story.narrative_prose || story.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(story.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(story.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : !isLoading && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">📖</span>
            <h2 className="text-2xl font-bold mb-2">No stories yet</h2>
            <p className="text-gray-600 mb-6">
              Start sharing your memories and they&apos;ll appear here.
            </p>
            <Button asChild size="lg">
              <Link href="/conversation">Share Your First Story</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
