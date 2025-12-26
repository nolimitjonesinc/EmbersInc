'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceButton } from '@/components/conversation/VoiceButton';
import { MessageBubble } from '@/components/conversation/MessageBubble';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { Message } from '@/types';
import { getStarterPrompts } from '@/lib/utils/chapters';
import { PERSONAS, DEFAULT_PERSONA, getPersona } from '@/lib/personas/definitions';

export default function ConversationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(DEFAULT_PERSONA);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get a starter prompt for the first message
  const [starterPrompt] = useState(() => getStarterPrompts()[0]);

  // Handle silence - auto-send after user stops speaking
  const handleSilence = useCallback(() => {
    if (transcript && !isProcessing) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, []);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onSilence: handleSilence,
    silenceTimeout: 5000,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show speech error
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  // Send message to API
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    setError(null);
    setIsProcessing(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userName,
          isFirstMessage: messages.length === 0,
          persona: selectedPersona,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-play the response
      await playAudio(data.message);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play TTS audio
  const playAudio = async (text: string) => {
    try {
      setIsSpeaking(true);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsSpeaking(false);
    }
  };

  // Toggle voice recording
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        handleSendMessage(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendMessage(inputText);
    }
  };

  // Handle name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setShowNamePrompt(false);
      // Store name for other pages
      localStorage.setItem('embers_user_name', userName);
      // Send initial greeting
      const greeting = `Hi, my name is ${userName}.`;
      handleSendMessage(greeting);
    }
  };

  // Save story to database
  const handleSaveStory = async () => {
    if (messages.length < 2) {
      setError('Have a conversation first before saving a story.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Combine user messages as the story content
      const userMessages = messages.filter(m => m.role === 'user');
      const content = userMessages.map(m => m.content).join('\n\n');

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          messages,
          generateNarrative: true,
          generateTitle: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save story');
      }

      const data = await response.json();
      setSavedStoryId(data.story.id);

      // Show success - the story was saved
      setError(null);
    } catch (err) {
      console.error('Save story error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Start a new conversation
  const handleNewConversation = () => {
    setMessages([]);
    setSavedStoryId(null);
    setError(null);
  };

  // Name prompt screen
  if (showNamePrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <span className="text-6xl">🔥</span>
            <h1 className="text-3xl font-bold">Welcome to Embers</h1>
            <p className="text-xl text-gray-600">
              I&apos;m excited to hear your stories. What should I call you?
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-6">
            <Input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="text-center text-xl"
              autoFocus
            />

            {/* Persona selector */}
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Who would you like to talk with?</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PERSONAS).map(([key, persona]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPersona(key)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedPersona === key
                        ? 'border-ember-orange bg-ember-gradient/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{persona.avatar}</span>
                      <span className="font-medium text-sm">{persona.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{persona.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!userName.trim()}>
              Let&apos;s Begin
            </Button>
          </form>

          <Link href="/" className="text-gray-500 hover:text-ember-orange transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const currentPersona = getPersona(selectedPersona);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold text-ember-gradient">Embers</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-600 hidden sm:inline">
              <span className="mr-1">{currentPersona.avatar}</span>
              {currentPersona.name}
            </span>
            {messages.length >= 2 && !savedStoryId && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveStory}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : '💾 Save Story'}
              </Button>
            )}
            {savedStoryId && (
              <>
                <span className="text-green-600 text-sm hidden sm:inline">✓ Saved</span>
                <Button variant="outline" size="sm" onClick={handleNewConversation}>
                  New Story
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/stories">My Stories</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Saved story notification */}
      {savedStoryId && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-green-800">
              ✓ Story saved successfully!
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/stories">View Stories</Link>
              </Button>
              <Button size="sm" onClick={handleNewConversation}>
                Start New Story
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Initial prompt if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <p className="text-xl text-gray-600">
                Press the button below and share a memory. Here&apos;s a thought to get you started:
              </p>
              <p className="text-2xl font-medium text-ember-orange italic">
                &ldquo;{starterPrompt}&rdquo;
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPlayAudio={
                message.role === 'assistant' ? () => playAudio(message.content) : undefined
              }
            />
          ))}

          {/* Current transcript while speaking */}
          {(transcript || interimTranscript) && (
            <div className="flex justify-end">
              <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 bg-ember-gradient/20 text-gray-700 rounded-br-sm border-2 border-dashed border-ember-orange">
                <p className="text-lg leading-relaxed">
                  {transcript}
                  <span className="text-gray-400">{interimTranscript}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Speaking...</p>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔥</span>
                  <span className="text-gray-500">Ember is thinking...</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-ember-orange rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <p className="text-center text-red-600">{error}</p>
        </div>
      )}

      {/* Voice controls */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Voice button */}
          <div className="flex flex-col items-center mb-6">
            <VoiceButton
              isListening={isListening}
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
              onClick={handleVoiceToggle}
              disabled={!isSupported}
            />
            {!isSupported && (
              <p className="text-sm text-red-500 mt-2">
                Voice not supported. Please use Chrome, Edge, or Safari.
              </p>
            )}
          </div>

          {/* Text input fallback */}
          <form onSubmit={handleTextSubmit} className="flex gap-3">
            <Input
              type="text"
              placeholder="Or type your message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing || !inputText.trim()}>
              Send
            </Button>
          </form>
        </div>
      </footer>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
