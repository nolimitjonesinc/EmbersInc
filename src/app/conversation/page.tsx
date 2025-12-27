'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BreathingEmber } from '@/components/conversation/BreathingEmber';
import { EmberParticles } from '@/components/conversation/EmberParticles';
import { SessionEnding } from '@/components/conversation/SessionEnding';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { Message } from '@/types';
import { getStarterPrompts } from '@/lib/utils/chapters';
import { PERSONAS, DEFAULT_PERSONA, getPersona } from '@/lib/personas/definitions';

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(DEFAULT_PERSONA);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [showSessionEnding, setShowSessionEnding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get a starter prompt for the first message
  const [starterPrompt] = useState(() => getStarterPrompts()[0]);

  // Handle extended silence - show "Take your time" after 8 seconds
  const startSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      setIsWaitingForUser(true);
    }, 8000);
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsWaitingForUser(false);
  }, []);

  // Handle silence - auto-send after user stops speaking
  const handleSilence = useCallback(() => {
    if (transcript && !isProcessing) {
      handleSendMessage(transcript);
      resetTranscript();
      clearSilenceTimer();
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

  // Start silence timer when listening begins
  useEffect(() => {
    if (isListening && !transcript && !interimTranscript) {
      startSilenceTimer();
    } else {
      clearSilenceTimer();
    }
  }, [isListening, transcript, interimTranscript, startSilenceTimer, clearSilenceTimer]);

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

  // Save story and show ceremonial ending
  const handleSaveStory = async () => {
    if (messages.length < 2) {
      setError('Have a conversation first before saving a story.');
      return;
    }

    setIsSaving(true);
    setError(null);

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

      // Show the ceremonial ending
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

  // Start a new conversation
  const handleNewConversation = () => {
    setMessages([]);
    setSavedStoryId(null);
    setError(null);
    setShowSessionEnding(false);
  };

  // Show ceremonial ending after saving
  if (showSessionEnding) {
    return (
      <SessionEnding
        userName={userName}
        storyId={savedStoryId || undefined}
        onNewStory={handleNewConversation}
      />
    );
  }

  // Name prompt screen - dark themed
  if (showNamePrompt) {
    return (
      <div className="min-h-screen recording-environment flex flex-col items-center justify-center p-6 relative">
        {/* Grain overlay */}
        <div className="recording-grain" />
        {/* Vignette */}
        <div className="recording-vignette" />

        {/* Particles */}
        <EmberParticles isActive intensity="low" />

        <div className="max-w-md w-full text-center space-y-10 relative z-10">
          {/* Ember */}
          <div className="relative w-32 h-32 mx-auto">
            <span
              className="absolute top-1/2 left-1/2 w-9 h-9 rounded-full animate-ember-breathe"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: `
                  0 0 40px 15px rgba(232, 109, 72, 0.5),
                  0 0 80px 30px rgba(232, 109, 72, 0.2)
                `,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          <div className="space-y-4 animate-fade-up-delay-1">
            <h1 className="recording-greeting">Welcome to Embers</h1>
            <p className="recording-prompt">
              I&apos;m excited to hear your stories. What should I call you?
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-8 animate-fade-up-delay-2">
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-transparent border-b border-text-whisper text-center text-2xl font-serif text-text-warm placeholder:text-text-whisper py-3 focus:outline-none focus:border-ember-orange transition-colors"
              autoFocus
            />

            {/* Persona selector - subtle */}
            <div className="space-y-4">
              <p className="text-sm text-text-whisper">Who would you like to talk with?</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERSONAS).map(([key, persona]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPersona(key)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedPersona === key
                        ? 'border-ember-orange/50 bg-ember-orange/10'
                        : 'border-text-whisper/20 hover:border-text-whisper/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{persona.avatar}</span>
                      <span className="font-medium text-sm text-text-warm">
                        {persona.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-whisper mt-1">{persona.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!userName.trim()}
              className="recording-btn-finish w-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ember-orange/10"
            >
              Let&apos;s Begin
            </button>
          </form>

          <Link
            href="/"
            className="text-text-whisper hover:text-text-soft transition-colors text-sm animate-fade-up-delay-3"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const currentPersona = getPersona(selectedPersona);

  return (
    <div className="min-h-screen flex flex-col recording-environment relative">
      {/* Grain overlay */}
      <div className="recording-grain" />
      {/* Vignette */}
      <div className="recording-vignette" />

      {/* Particles - more active when listening */}
      <EmberParticles isActive={isListening} intensity={isListening ? 'medium' : 'low'} />

      {/* Header - minimal, transparent */}
      <header className="sticky top-0 z-50 bg-recording-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 10px 3px rgba(232, 109, 72, 0.4)',
              }}
            />
            <span className="text-lg font-serif text-text-soft group-hover:text-text-warm transition-colors">
              Embers
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-text-whisper text-sm hidden sm:inline">
              <span className="mr-1">{currentPersona.avatar}</span>
              {currentPersona.name}
            </span>
            {messages.length >= 2 && !savedStoryId && (
              <button
                onClick={handleSaveStory}
                disabled={isSaving}
                className="recording-btn-finish text-xs py-2 px-4"
              >
                {isSaving ? 'Saving...' : 'Save Story'}
              </button>
            )}
            <Link
              href="/stories"
              className="text-text-whisper hover:text-text-soft text-sm transition-colors"
            >
              My Stories
            </Link>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {/* Initial state - centered ember with prompt */}
          {messages.length === 0 && !isListening && !isProcessing && (
            <div className="text-center py-20 space-y-8">
              <div className="relative w-36 h-36 mx-auto">
                <BreathingEmber
                  isListening={isListening}
                  isProcessing={isProcessing}
                  isSpeaking={isSpeaking}
                  isWaiting={isWaitingForUser}
                  onClick={handleVoiceToggle}
                  disabled={!isSupported}
                />
              </div>

              <div className="space-y-4 animate-fade-up-delay-1">
                <p className="recording-greeting">I&apos;m listening, {userName}.</p>
                <p className="recording-prompt">{starterPrompt}</p>
              </div>

              {!isSupported && (
                <p className="text-sm text-red-400">
                  Voice not supported. Please use Chrome, Edge, or Safari.
                </p>
              )}
            </div>
          )}

          {/* Conversation in progress */}
          {(messages.length > 0 || isListening || isProcessing) && (
            <>
              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 ${
                      message.role === 'user'
                        ? 'recording-message-user rounded-br-sm'
                        : 'recording-message-assistant rounded-bl-sm'
                    }`}
                  >
                    <p className="text-lg leading-relaxed font-serif">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Current transcript while speaking */}
              {(transcript || interimTranscript) && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 recording-message-user rounded-br-sm opacity-70 border-2 border-dashed border-ember-orange/50">
                    <p className="text-lg leading-relaxed font-serif">
                      {transcript}
                      <span className="opacity-50">{interimTranscript}</span>
                    </p>
                    <p className="text-xs opacity-60 mt-2">Speaking...</p>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="recording-message-assistant rounded-2xl px-6 py-4 rounded-bl-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{
                          background:
                            'radial-gradient(circle, #f4a574, #E86D48)',
                          boxShadow: '0 0 8px 2px rgba(232, 109, 72, 0.4)',
                        }}
                      />
                      <span className="text-text-soft font-serif">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-3 relative z-20">
          <p className="text-center text-red-400">{error}</p>
        </div>
      )}

      {/* Voice controls - always visible once conversation starts */}
      {(messages.length > 0 || isListening || isProcessing) && (
        <footer className="sticky bottom-0 bg-recording-bg/90 backdrop-blur-md border-t border-white/5 relative z-20">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Centered ember button */}
            <div className="flex flex-col items-center mb-6">
              <BreathingEmber
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                isWaiting={isWaitingForUser}
                onClick={handleVoiceToggle}
                disabled={!isSupported || isSpeaking || isProcessing}
              />
            </div>

            {/* Text input fallback - subtle */}
            <form onSubmit={handleTextSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Or type here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
                className="flex-1 bg-transparent border border-text-whisper/30 rounded-full px-5 py-3 text-text-warm placeholder:text-text-whisper focus:outline-none focus:border-ember-orange/50 transition-colors"
              />
              <button
                type="submit"
                disabled={isProcessing || !inputText.trim()}
                className="recording-btn-finish px-6 disabled:opacity-30"
              >
                Send
              </button>
            </form>
          </div>
        </footer>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
