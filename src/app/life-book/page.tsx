'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Story, ChapterType } from '@/types';
import { chapters } from '@/lib/utils/chapters';

// Mock stories for demo (will be replaced with Supabase)
const mockStories: Story[] = [
  {
    id: '1',
    userId: '1',
    title: 'The Winking Star',
    content:
      'It was Christmas 1952, and we had this beautiful pine tree that barely fit through the door. Dad had insisted on cutting it himself from Uncle Jim\'s farm...',
    chapter: 'where-i-come-from',
    tags: ['Christmas', 'Family', 'Traditions'],
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20'),
    isPublic: false,
  },
  {
    id: '2',
    userId: '1',
    title: 'Brothers and Dirt Clod Fights',
    content:
      'We would go on hikes, have dirt clod fights, and play Cowboys and Indians. We had a creek that ran by our house that we would often go play in as kids...',
    chapter: 'where-i-come-from',
    tags: ['Childhood', 'Brother', 'Adventures'],
    createdAt: new Date('2024-12-19'),
    updatedAt: new Date('2024-12-19'),
    isPublic: false,
  },
  {
    id: '3',
    userId: '1',
    title: 'The Day We Went Our Separate Ways',
    content:
      'We met at our high school parking lot. He was going to Missouri and I was going to California. A sense of freedom and a sense of sadness...',
    chapter: 'who-i-am',
    tags: ['Growth', 'Independence', 'Twin'],
    createdAt: new Date('2024-12-18'),
    updatedAt: new Date('2024-12-18'),
    isPublic: false,
  },
  {
    id: '4',
    userId: '1',
    title: 'My First Job at the Cannery',
    content:
      'I was sixteen when I started working at the Del Monte cannery. The summer heat, the smell of peaches, and the camaraderie with the other workers...',
    chapter: 'what-ive-learned',
    tags: ['Work', 'Youth', 'Life Lessons'],
    createdAt: new Date('2024-12-17'),
    updatedAt: new Date('2024-12-17'),
    isPublic: false,
  },
  {
    id: '5',
    userId: '1',
    title: 'Dancing with Your Grandmother',
    content:
      'The first time I saw her was at a church social. She was wearing a blue dress and laughing at something her friend said. I knew right then...',
    chapter: 'what-ive-loved',
    tags: ['Love', 'Romance', 'Marriage'],
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-16'),
    isPublic: false,
  },
];

export default function LifeBookPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterType | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Load stories (mock for now)
    setStories(mockStories);

    // Get user name from localStorage
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
    }
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
            <span className="text-ember-orange font-semibold">{totalStories}</span>
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
                          <p className="text-gray-600 line-clamp-2 mb-3">{story.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {story.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-500"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(story.createdAt).toLocaleDateString()}
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
