'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extra-large'>('large');
  const [saveMessage, setSaveMessage] = useState('');
  const [stats, setStats] = useState({
    totalStories: 0,
    totalWords: 0,
    chaptersStarted: 0,
    daysActive: 0,
  });

  // Invite link state
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
      setNewName(storedName);
    }

    const storedAutoPlay = localStorage.getItem('embers_auto_play');
    if (storedAutoPlay !== null) {
      setAutoPlayAudio(storedAutoPlay === 'true');
    }

    const storedVoiceSpeed = localStorage.getItem('embers_voice_speed') as typeof voiceSpeed;
    if (storedVoiceSpeed) {
      setVoiceSpeed(storedVoiceSpeed);
    }

    const storedTextSize = localStorage.getItem('embers_text_size') as typeof textSize;
    if (storedTextSize) {
      setTextSize(storedTextSize);
    }

    // Fetch real stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stories');
        if (response.ok) {
          const data = await response.json();
          const stories = data.stories || [];
          const totalWords = stories.reduce((sum: number, s: { content?: string }) => {
            return sum + (s.content ? s.content.split(/\s+/).length : 0);
          }, 0);
          const chapters = new Set(
            stories.map((s: { chapter?: string }) => s.chapter).filter(Boolean)
          );
          setStats({
            totalStories: stories.length,
            totalWords,
            chaptersStarted: chapters.size,
            daysActive: 0, // calculated below
          });
        }
      } catch (err) {
        console.warn('[Profile] Could not fetch stories:', err);
      }

      // Calculate days active from session data
      try {
        const sessionStr = localStorage.getItem('embers_session_data');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.firstVisit) {
            const firstVisit = new Date(session.firstVisit);
            const now = new Date();
            const days = Math.max(1, Math.ceil((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24)));
            setStats(prev => ({ ...prev, daysActive: days }));
          }
        }
      } catch {
        // Session data not available — leave as 0
      }
    };
    fetchStats();
  }, []);

  const handleSaveName = () => {
    if (newName.trim()) {
      localStorage.setItem('embers_user_name', newName.trim());
      setUserName(newName.trim());
      setEditingName(false);
      showSaveMessage();
    }
  };

  const handleToggleAutoPlay = () => {
    const newValue = !autoPlayAudio;
    setAutoPlayAudio(newValue);
    localStorage.setItem('embers_auto_play', String(newValue));
    showSaveMessage();
  };

  const handleVoiceSpeedChange = (speed: typeof voiceSpeed) => {
    setVoiceSpeed(speed);
    localStorage.setItem('embers_voice_speed', speed);
    showSaveMessage();
  };

  const handleTextSizeChange = (size: typeof textSize) => {
    setTextSize(size);
    localStorage.setItem('embers_text_size', size);
    showSaveMessage();
  };

  const showSaveMessage = () => {
    setSaveMessage('Settings saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleGetInviteLink = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await fetch('/api/family/invite-link');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteError(data.error || 'Could not generate invite link.');
        return;
      }
      const data = await res.json();
      setInviteLink(`${window.location.origin}/ask/${data.inviteCode}`);
    } catch {
      setInviteError('Could not generate invite link. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold text-ember-gradient">Embers</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/stories"
              className="text-gray-600 hover:text-ember-orange transition-colors"
            >
              My Stories
            </Link>
            <Button asChild>
              <Link href="/conversation">+ New Story</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-ember-gradient rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>

          {editingName ? (
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-center"
                autoFocus
              />
              <Button onClick={handleSaveName} disabled={!newName.trim()}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold">{userName || 'Your Name'}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="text-gray-400 hover:text-ember-orange transition-colors"
                aria-label="Edit name"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Save message toast */}
        {saveMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-fadeIn z-50">
            {saveMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-ember-orange">{stats.totalStories}</p>
              <p className="text-gray-600 text-sm">Stories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-ember-orange">
                {stats.totalWords.toLocaleString()}
              </p>
              <p className="text-gray-600 text-sm">Words</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-ember-orange">{stats.chaptersStarted}/7</p>
              <p className="text-gray-600 text-sm">Chapters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-ember-orange">{stats.daysActive}</p>
              <p className="text-gray-600 text-sm">Days Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span>
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Auto-play audio */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-play Responses</h3>
                <p className="text-gray-500 text-sm">
                  Automatically speak Embers&apos; responses out loud
                </p>
              </div>
              <button
                onClick={handleToggleAutoPlay}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  autoPlayAudio ? 'bg-ember-orange' : 'bg-gray-300'
                }`}
                aria-label="Toggle auto-play"
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    autoPlayAudio ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Voice speed */}
            <div>
              <h3 className="font-medium mb-3">Voice Speed</h3>
              <div className="flex gap-3">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleVoiceSpeedChange(speed)}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      voiceSpeed === speed
                        ? 'bg-ember-orange text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {speed.charAt(0).toUpperCase() + speed.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Text size */}
            <div>
              <h3 className="font-medium mb-3">Text Size</h3>
              <div className="flex gap-3">
                {(['normal', 'large', 'extra-large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleTextSizeChange(size)}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      textSize === size
                        ? 'bg-ember-orange text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {size === 'extra-large'
                      ? 'Extra Large'
                      : size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔗</span>
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/life-book"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="font-medium">View Life Book</h3>
                  <p className="text-gray-500 text-sm">See all your stories organized by chapter</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            <Link
              href="/stories"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-medium">All Stories</h3>
                  <p className="text-gray-500 text-sm">Browse and manage your stories</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            <Link
              href="/conversation"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎙️</span>
                <div>
                  <h3 className="font-medium">Share a Story</h3>
                  <p className="text-gray-500 text-sm">Start a new conversation with Embers</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* Family Questions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span>
              Family Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Share a link so family and friends can ask you questions. Anyone with this link can
              send you a question. You&apos;ll hear it in your next conversation.
            </p>

            {inviteLink ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button onClick={handleCopyInviteLink}>
                    {inviteCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleGetInviteLink} disabled={inviteLoading}>
                {inviteLoading ? 'Generating...' : 'Get Invite Link'}
              </Button>
            )}

            {inviteError && (
              <p className="text-red-500 text-sm mt-3">{inviteError}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
