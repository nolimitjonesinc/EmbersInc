'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CampfireVisual } from '@/components/conversation/CampfireVisual';
import { SessionEnding } from '@/components/conversation/SessionEnding';
import { SilenceProgressBar } from '@/components/conversation/SilenceProgressBar';
import { InactivityPrompt } from '@/components/conversation/InactivityPrompt';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { Message } from '@/types';
import { getStarterPrompts } from '@/lib/utils/chapters';
import { getPersona, DEFAULT_PERSONA } from '@/lib/personas/definitions';

// Natural language phrases that indicate end of conversation
const END_PHRASES = [
  'goodbye',
  'good bye',
  'bye bye',
  'thank you',
  'thanks',
  "that's all",
  "that is all",
  "i'm done",
  "i am done",
  'save this',
  'save my story',
  'save our conversation',
  "that's all for today",
  "that's all for now",
];

function detectEndPhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  return END_PHRASES.some((phrase) => lowerText.includes(phrase));
}

const INACTIVITY_TIMEOUT = 6 * 60 * 1000;

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [showSessionEnding, setShowSessionEnding] = useState(false);
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoResumeRef = useRef(false);

  const [starterPrompt] = useState(() => getStarterPrompts()[0]);
  const persona = getPersona(DEFAULT_PERSONA);

  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
    }
    // Get saved stories count for ember display
    const fetchStoriesCount = async () => {
      try {
        const response = await fetch('/api/stories');
        if (response.ok) {
          const data = await response.json();
          setSavedStoriesCount(data.stories?.length || 0);
        }
      } catch {
        // Ignore errors
      }
    };
    fetchStoriesCount();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    setShowInactivityPrompt(false);
    inactivityTimerRef.current = setTimeout(() => {
      if (messages.length >= 2) {
        setShowInactivityPrompt(true);
      }
    }, INACTIVITY_TIMEOUT);
  }, [messages.length]);

  const handleSilence = useCallback(() => {
    if (transcript && !isProcessing && !isPaused) {
      if (detectEndPhrase(transcript)) {
        setShowEndPrompt(true);
      }
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
    silenceStage,
    silenceDuration,
    silenceMessage,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onSilence: handleSilence,
    silenceTimeout: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [messages, isListening, resetInactivityTimer]);

  useEffect(() => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      const previousAssistantMessage = messages[messages.length - 2];

      if (previousAssistantMessage?.role === 'assistant' &&
          previousAssistantMessage.content.toLowerCase().includes('what') &&
          previousAssistantMessage.content.toLowerCase().includes('name') &&
          lastUserMessage?.role === 'user') {
        const nameMatch = lastUserMessage.content.match(/(?:i'm|i am|my name is|call me|it's|its)\s+(\w+)/i) ||
                         lastUserMessage.content.match(/^(\w+)$/i);
        if (nameMatch && nameMatch[1]) {
          const extractedName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
          setUserName(extractedName);
          localStorage.setItem('embers_user_name', extractedName);
        }
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    setError(null);
    setIsProcessing(true);
    resetInactivityTimer();

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
          persona: DEFAULT_PERSONA,
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
      shouldAutoResumeRef.current = true;
      await playAudio(data.message);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

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

        if (shouldAutoResumeRef.current && !isPaused && isSupported) {
          shouldAutoResumeRef.current = false;
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsSpeaking(false);
      if (shouldAutoResumeRef.current && !isPaused && isSupported) {
        shouldAutoResumeRef.current = false;
        setTimeout(() => {
          startListening();
        }, 500);
      }
    }
  };

  const handleFireClick = () => {
    if (isPaused || isSpeaking || isProcessing) return;

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

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      resetInactivityTimer();
    } else {
      setIsPaused(true);
      stopListening();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsSpeaking(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      if (detectEndPhrase(inputText)) {
        setShowEndPrompt(true);
      }
      handleSendMessage(inputText);
    }
  };

  const handleSaveStory = async () => {
    if (messages.length < 2) {
      setError('Have a conversation first before saving a story.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setShowEndPrompt(false);
    setShowInactivityPrompt(false);

    stopListening();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const userMessages = messages.filter((m) => m.role === 'user');
      const content = userMessages.map((m) => m.content).join('\n\n');

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
      setSavedStoriesCount((prev) => prev + 1);
      setShowSessionEnding(true);
    } catch (err) {
      console.error('Save story error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to save story. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleInactivityContinue = () => {
    setShowInactivityPrompt(false);
    resetInactivityTimer();
  };

  const handleNewConversation = () => {
    setMessages([]);
    setSavedStoryId(null);
    setError(null);
    setShowSessionEnding(false);
    setShowEndPrompt(false);
    setIsPaused(false);
  };

  if (showSessionEnding) {
    return (
      <SessionEnding
        userName={userName}
        storyId={savedStoryId || undefined}
        onNewStory={handleNewConversation}
      />
    );
  }

  const hasActiveInput = transcript || interimTranscript;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0c0b] relative overflow-hidden">
      {/* Inactivity prompt */}
      <InactivityPrompt
        isVisible={showInactivityPrompt}
        onContinue={handleInactivityContinue}
        onSaveAndExit={handleSaveStory}
      />

      {/* End phrase detected prompt */}
      {showEndPrompt && messages.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0d0c0b]/90 backdrop-blur-md" />
          <div className="relative bg-[#1a1714] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center animate-fade-up">
            <h3 className="text-xl font-serif text-[#f9f7f2] mb-3">
              Ready to save your story?
            </h3>
            <p className="text-[#f9f7f2]/50 mb-6 text-sm">
              It sounds like you might be wrapping up.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndPrompt(false)}
                className="flex-1 py-3 px-4 rounded-full text-[#f9f7f2]/70 border border-white/10 hover:bg-white/5 transition-all text-sm"
              >
                Keep Going
              </button>
              <button
                onClick={handleSaveStory}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-all text-sm"
                style={{
                  background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal header - fades when listening */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-500 ${
          isListening ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-serif text-[#f9f7f2]/60 group-hover:text-[#f9f7f2] transition-colors">
              Embers
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {messages.length >= 2 && !savedStoryId && (
              <button
                onClick={handleSaveStory}
                disabled={isSaving}
                className="text-xs py-2 px-4 rounded-full border border-[#E86D48]/30 text-[#E86D48] hover:bg-[#E86D48]/10 transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Story'}
              </button>
            )}
            <Link
              href="/stories"
              className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/70 text-sm transition-colors"
            >
              My Stories
            </Link>
          </div>
        </div>
      </header>

      {/* Main content area - the fire takes center stage */}
      <main className="flex-1 flex flex-col">
        {/* Messages area - floats above fire, scrollable */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto pt-16 pb-4 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-br-sm'
                        : 'bg-white/5 border border-white/10 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-base leading-relaxed font-serif text-[#f9f7f2]/90">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Live transcript */}
              {hasActiveInput && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-[#E86D48]/10 border-2 border-dashed border-[#E86D48]/40 rounded-br-sm">
                    <p className="text-base leading-relaxed font-serif text-[#f9f7f2]/70">
                      {transcript}
                      <span className="opacity-50">{interimTranscript}</span>
                    </p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 rounded-bl-sm">
                    <p className="text-[#f9f7f2]/50 font-serif">Thinking...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* The Fire - Hero element */}
        <div
          className={`relative transition-all duration-700 ${
            messages.length === 0 ? 'flex-1 min-h-[60vh]' : 'h-[35vh] min-h-[250px]'
          }`}
        >
          {/* Welcome text - only on first visit */}
          {messages.length === 0 && !isListening && !isProcessing && (
            <div className="absolute top-8 left-0 right-0 text-center z-10 px-4">
              <p className="text-2xl md:text-3xl font-serif text-[#f9f7f2]/80 mb-3">
                {userName ? `Welcome back, ${userName}.` : 'Welcome.'}
              </p>
              <p className="text-lg text-[#f9f7f2]/50 max-w-md mx-auto font-serif italic">
                {starterPrompt}
              </p>
            </div>
          )}

          {/* The campfire */}
          <CampfireVisual
            isActive={!!(transcript || interimTranscript)}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            onFireClick={handleFireClick}
            showEmbers={savedStoriesCount}
          />

          {/* Silence progress bar */}
          {isListening && hasActiveInput && silenceStage !== 'none' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <SilenceProgressBar
                stage={silenceStage}
                progress={silenceDuration}
                message={silenceMessage}
                isVisible={true}
              />
            </div>
          )}
        </div>
      </main>

      {/* Error message */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-center text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Bottom controls - minimal */}
      <footer className="relative z-20 bg-gradient-to-t from-[#0d0c0b] via-[#0d0c0b] to-transparent pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Pause indicator */}
          {isPaused && (
            <p className="text-center text-[#f9f7f2]/40 text-sm mb-4">
              Paused
            </p>
          )}

          {/* Control row */}
          <div className="flex items-center gap-4">
            {/* Pause button */}
            <button
              onClick={handlePauseToggle}
              disabled={!isSupported || isProcessing}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isPaused
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                  : 'bg-white/5 border border-white/10 text-[#f9f7f2]/40 hover:bg-white/10'
              }`}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Text input */}
            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-3">
              <input
                type="text"
                placeholder="Or type here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing || isPaused}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-[#f9f7f2] placeholder:text-[#f9f7f2]/30 focus:outline-none focus:border-[#E86D48]/50 transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={isProcessing || !inputText.trim() || isPaused}
                className="px-5 py-3 rounded-full text-sm transition-all disabled:opacity-30 bg-[#E86D48]/20 border border-[#E86D48]/30 text-[#E86D48] hover:bg-[#E86D48]/30"
              >
                Send
              </button>
            </form>
          </div>

          {/* Voice not supported warning */}
          {!isSupported && (
            <p className="text-center text-red-400/70 text-xs mt-4">
              Voice not supported in this browser. Please use Chrome, Edge, or Safari.
            </p>
          )}
        </div>
      </footer>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
