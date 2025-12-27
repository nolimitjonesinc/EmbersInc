'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChapterType } from '@/types';
import { chapters } from '@/lib/utils/chapters';

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
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
    }

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
          <div className="flex items-center gap-6">
            <Link
              href="/life-book"
              className="text-[#f9f7f2]/50 hover:text-[#f9f7f2] transition-colors text-sm hidden sm:block"
            >
              Life Book
            </Link>
            <Link
              href="/conversation"
              className="px-5 py-2 rounded-full text-sm transition-all border border-[#E86D48]/30 hover:border-[#E86D48] hover:bg-[#E86D48]/10"
            >
              + New Story
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-3">
            {userName ? `${userName}'s Stories` : 'My Stories'}
          </h1>
          <p className="text-[#f9f7f2]/50">
            {isLoading
              ? 'Loading...'
              : `${stories.length} ${stories.length === 1 ? 'memory' : 'memories'} preserved`}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 p-6 animate-pulse"
              >
                <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-16 bg-white/5 rounded mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!isLoading && stories.length > 0 && (
          <div className="mb-10 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-[#E86D48] text-white'
                    : 'bg-white/5 text-[#f9f7f2]/60 hover:bg-white/10'
                }`}
              >
                All Stories
              </button>
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setFilter(chapter.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                    filter === chapter.id
                      ? 'bg-[#E86D48] text-white'
                      : 'bg-white/5 text-[#f9f7f2]/60 hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: chapter.color }}
                  />
                  {chapter.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stories grid */}
        {!isLoading && filteredStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const chapterInfo = getChapterInfo(story.chapter);
              return (
                <div
                  key={story.id}
                  className="rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group overflow-hidden relative"
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${chapterInfo?.gradient || 'from-orange-500/20 via-amber-500/10'} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`}
                  />
                  <div
                    className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-2xl"
                    style={{ backgroundColor: chapterInfo?.color || '#E86D48' }}
                  />

                  <div className="p-6 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-[#f9f7f2]/40 mb-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: chapterInfo?.color || '#E86D48' }}
                      />
                      <span>{chapterInfo?.title}</span>
                    </div>
                    <h3 className="text-xl font-serif mb-3 group-hover:text-[#E86D48] transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-[#f9f7f2]/50 line-clamp-3 mb-4 text-sm leading-relaxed">
                      {story.narrative_prose || story.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(story.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/5 rounded-full text-xs text-[#f9f7f2]/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#f9f7f2]/30">
                      {new Date(story.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-24">
              {/* Empty ember */}
              <div className="w-20 h-20 mx-auto mb-8 relative">
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full opacity-50"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                    boxShadow: '0 0 30px 8px rgba(232, 109, 72, 0.3)',
                  }}
                />
              </div>
              <h2 className="text-2xl font-serif mb-3">No stories yet</h2>
              <p className="text-[#f9f7f2]/50 mb-8 max-w-md mx-auto">
                Your memories are waiting to be shared. Start a conversation and watch your collection grow.
              </p>
              <Link
                href="/conversation"
                className="inline-block px-8 py-4 rounded-full transition-all"
                style={{
                  background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                  boxShadow: '0 0 25px rgba(232, 109, 72, 0.3)',
                }}
              >
                Share Your First Story
              </Link>
            </div>
          )
        )}
      </main>
    </div>
  );
}
