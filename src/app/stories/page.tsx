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
];

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<ChapterType | 'all'>('all');
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
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} preserved
          </p>
        </div>

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
        {filteredStories.length > 0 ? (
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
                      {story.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(story.createdAt).toLocaleDateString('en-US', {
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
        ) : (
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
