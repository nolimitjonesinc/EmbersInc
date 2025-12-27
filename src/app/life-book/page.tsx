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

export default function LifeBookPage() {
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterType | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
              href="/stories"
              className="text-[#f9f7f2]/50 hover:text-[#f9f7f2] transition-colors text-sm hidden sm:block"
            >
              All Stories
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
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            {userName ? `${userName}'s Life Book` : 'My Life Book'}
          </h1>
          <p className="text-xl text-[#f9f7f2]/50 max-w-2xl mx-auto mb-6">
            Seven chapters. One life. Infinite stories.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, #E86D48, #c45a3a)',
                boxShadow: '0 0 8px rgba(232, 109, 72, 0.5)',
              }}
            />
            <span className="text-[#f9f7f2]/70">
              {isLoading ? '...' : totalStories} {totalStories === 1 ? 'story' : 'stories'} preserved
            </span>
          </div>
        </div>

        {/* Chapter grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {chapters.map((chapter) => {
            const chapterStories = getStoriesForChapter(chapter.id);
            const storyCount = chapterStories.length;

            return (
              <div
                key={chapter.id}
                className="rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${chapter.color}10 0%, transparent 100%)`,
                }}
                onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl group-hover:scale-110 transition-transform">
                      {chapter.icon}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${chapter.color}20`,
                        color: chapter.color,
                      }}
                    >
                      {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif mb-2 group-hover:text-[#E86D48] transition-colors">
                    {chapter.title}
                  </h3>
                  <p className="text-[#f9f7f2]/40 text-sm leading-relaxed mb-4">
                    {chapter.description}
                  </p>

                  {/* Preview of stories */}
                  {storyCount > 0 ? (
                    <div className="space-y-2">
                      {chapterStories.slice(0, 2).map((story) => (
                        <div
                          key={story.id}
                          className="text-sm text-[#f9f7f2]/50 truncate flex items-center gap-2"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: chapter.color }}
                          />
                          {story.title}
                        </div>
                      ))}
                      {storyCount > 2 && (
                        <p className="text-xs text-[#f9f7f2]/30">+{storyCount - 2} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#f9f7f2]/30 italic">No stories yet</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected chapter detail */}
        {selectedChapter && (
          <div className="rounded-2xl border border-white/10 bg-[#141210] p-8 mb-16">
            {(() => {
              const chapter = chapters.find((c) => c.id === selectedChapter);
              const chapterStories = getStoriesForChapter(selectedChapter);

              if (!chapter) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <span className="text-5xl">{chapter.icon}</span>
                      <div>
                        <h2 className="text-2xl font-serif">{chapter.title}</h2>
                        <p className="text-[#f9f7f2]/50">{chapter.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedChapter(null)}
                      className="text-[#f9f7f2]/30 hover:text-[#f9f7f2]/60 text-2xl transition-colors"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  {/* Prompts */}
                  <div className="mb-8">
                    <h3 className="text-sm uppercase tracking-widest text-[#f9f7f2]/40 mb-4">
                      Story Prompts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {chapter.prompts.slice(0, 4).map((prompt, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-white/5 rounded-full text-sm text-[#f9f7f2]/60"
                        >
                          {prompt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stories in this chapter */}
                  {chapterStories.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-sm uppercase tracking-widest text-[#f9f7f2]/40 mb-4">
                        Stories ({chapterStories.length})
                      </h3>
                      {chapterStories.map((story) => (
                        <div
                          key={story.id}
                          className="p-5 bg-white/5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
                        >
                          <h4 className="font-serif text-lg mb-2">{story.title}</h4>
                          <p className="text-[#f9f7f2]/50 line-clamp-2 text-sm mb-3">
                            {story.narrative_prose || story.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {(story.tags || []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-[#f9f7f2]/40"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-[#f9f7f2]/30">
                              {new Date(story.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/5 rounded-xl">
                      <p className="text-[#f9f7f2]/50 mb-4">No stories in this chapter yet.</p>
                      <Link
                        href="/conversation"
                        className="inline-block px-6 py-3 rounded-full text-sm transition-all border border-[#E86D48]/50 hover:bg-[#E86D48]/10"
                      >
                        Add Your First Story
                      </Link>
                    </div>
                  )}

                  {/* Add story button */}
                  {chapterStories.length > 0 && (
                    <div className="mt-8 text-center">
                      <Link
                        href="/conversation"
                        className="inline-block px-6 py-3 rounded-full text-sm transition-all border border-white/10 hover:border-[#E86D48]/50 hover:bg-[#E86D48]/10"
                      >
                        Add Another Story
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && totalStories === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full opacity-60"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                  boxShadow: '0 0 40px 12px rgba(232, 109, 72, 0.3)',
                }}
              />
            </div>
            <h2 className="text-3xl font-serif mb-4">Your Life Book Awaits</h2>
            <p className="text-[#f9f7f2]/50 text-lg mb-10 max-w-lg mx-auto">
              Every chapter begins with a single story. Start sharing your memories and watch your book come to life.
            </p>
            <Link
              href="/conversation"
              className="inline-block px-10 py-4 rounded-full text-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 30px rgba(232, 109, 72, 0.35)',
              }}
            >
              Share Your First Story
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && totalStories > 0 && (
          <div className="text-center py-16 rounded-2xl bg-gradient-to-t from-[#E86D48]/5 to-transparent">
            <h2 className="text-2xl font-serif mb-4">Keep Building Your Legacy</h2>
            <p className="text-[#f9f7f2]/50 mb-8">
              Every story you share becomes a treasured gift for your family.
            </p>
            <Link
              href="/conversation"
              className="inline-block px-8 py-4 rounded-full transition-all"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 25px rgba(232, 109, 72, 0.3)',
              }}
            >
              Add Another Story
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
