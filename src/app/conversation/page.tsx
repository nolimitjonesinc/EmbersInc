'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BreathingEmber } from '@/components/conversation/BreathingEmber';
import { EmberParticles } from '@/components/conversation/EmberParticles';
import { SessionEnding } from '@/components/conversation/SessionEnding';
import { SilenceProgressBar } from '@/components/conversation/SilenceProgressBar';
import { InactivityPrompt } from '@/components/conversation/InactivityPrompt';
import { useSpeechRecognition, SilenceStage } from '@/lib/speech/useSpeechRecognition';
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

// Check if transcript contains end phrases
function detectEndPhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  return END_PHRASES.some((phrase) => lowerText.includes(phrase));
}

// Inactivity timeout (6 minutes like iOS)
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoResumeRef = useRef(false);

  // Get a starter prompt for the first message
  const [starterPrompt] = useState(() => getStarterPrompts()[0]);
  const persona = getPersona(DEFAULT_PERSONA);

  // Load stored name on mount
  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // Reset inactivity timer
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

  // Handle silence auto-send
  const handleSilence = useCallback(() => {
    if (transcript && !isProcessing && !isPaused) {
      // Check for end phrases before sending
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

  // Reset inactivity timer on any activity
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [messages, isListening, resetInactivityTimer]);

  // Extract name from conversation if AI asks and user responds
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

  // Send message to API
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

      // Mark that we should auto-resume listening after speaking
      shouldAutoResumeRef.current = true;

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

        // Auto-resume listening after AI finishes speaking
        if (shouldAutoResumeRef.current && !isPaused && isSupported) {
          shouldAutoResumeRef.current = false;
          setTimeout(() => {
            startListening();
          }, 500); // Small delay for natural feel
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
      // Still try to auto-resume even if audio fails
      if (shouldAutoResumeRef.current && !isPaused && isSupported) {
        shouldAutoResumeRef.current = false;
        setTimeout(() => {
          startListening();
        }, 500);
      }
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

  // Pause/Resume conversation
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

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      // Check for end phrases
      if (detectEndPhrase(inputText)) {
        setShowEndPrompt(true);
      }
      handleSendMessage(inputText);
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
    setShowEndPrompt(false);
    setShowInactivityPrompt(false);

    // Stop any ongoing listening/speaking
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

  // Handle inactivity prompt actions
  const handleInactivityContinue = () => {
    setShowInactivityPrompt(false);
    resetInactivityTimer();
  };

  // Start a new conversation
  const handleNewConversation = () => {
    setMessages([]);
    setSavedStoryId(null);
    setError(null);
    setShowSessionEnding(false);
    setShowEndPrompt(false);
    setIsPaused(false);
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

  // Get ember color based on silence stage
  const getEmberStageColor = () => {
    if (!isListening) return undefined;
    switch (silenceStage) {
      case 'detected':
        return '#3B82F6'; // blue
      case 'preparing':
        return '#F97316'; // orange
      case 'readyToSend':
        return '#22C55E'; // green
      default:
        return undefined;
    }
  };

  return (
    <div className="min-h-screen flex flex-col recording-environment relative">
      {/* Grain overlay */}
      <div className="recording-grain" />
      {/* Vignette */}
      <div className="recording-vignette" />

      {/* Particles - more active when listening */}
      <EmberParticles isActive={isListening || isProcessing || messages.length === 0} intensity={isListening ? 'medium' : 'low'} />

      {/* Inactivity prompt */}
      <InactivityPrompt
        isVisible={showInactivityPrompt}
        onContinue={handleInactivityContinue}
        onSaveAndExit={handleSaveStory}
      />

      {/* End phrase detected prompt */}
      {showEndPrompt && messages.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#1a1714]/80 backdrop-blur-md" />
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

      {/* Header - minimal, transparent */}
      <header className="sticky top-0 z-40 bg-recording-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 10px 3px rgba(232, 109, 72, 0.4)',
              }}
            />
            <span className="text-lg font-serif text-text-soft group-hover:text-text-warm transition-colors">
              Embers
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-text-whisper text-sm hidden sm:inline">
              <span className="mr-1">{persona.avatar}</span>
              {persona.name}
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
                  isWaiting={false}
                  onClick={handleVoiceToggle}
                  disabled={!isSupported}
                  stageColor={getEmberStageColor()}
                />
              </div>

              <div className="space-y-4 animate-fade-up-delay-1">
                <p className="recording-greeting">
                  {userName ? `Welcome back, ${userName}.` : "Hello. I'm here to listen."}
                </p>
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                          background: 'radial-gradient(circle, #f4a574, #E86D48)',
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

      {/* Voice controls - always visible */}
      <footer className="sticky bottom-0 bg-recording-bg/90 backdrop-blur-md border-t border-white/5 relative z-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Control buttons row */}
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Pause/Resume button */}
            <button
              onClick={handlePauseToggle}
              disabled={!isSupported || isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isPaused
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-white/5 border border-white/10 text-text-whisper hover:bg-white/10'
              }`}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                // Play icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                // Pause icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Main ember button */}
            <div className="relative">
              <BreathingEmber
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                isWaiting={false}
                onClick={handleVoiceToggle}
                disabled={!isSupported || isSpeaking || isProcessing || isPaused}
                stageColor={getEmberStageColor()}
              />
            </div>

            {/* Spacer for symmetry */}
            <div className="w-12" />
          </div>

          {/* Silence progress bar - shown when listening and has content */}
          {isListening && (transcript || interimTranscript) && (
            <div className="flex justify-center mb-4">
              <SilenceProgressBar
                stage={silenceStage}
                progress={silenceDuration}
                message={silenceMessage}
                isVisible={silenceStage !== 'none'}
              />
            </div>
          )}

          {/* Pause indicator */}
          {isPaused && (
            <p className="text-center text-text-whisper text-sm mb-4">
              Paused — tap play to continue
            </p>
          )}

          {/* Text input fallback - subtle */}
          <form onSubmit={handleTextSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Or type here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isPaused}
              className="flex-1 bg-transparent border border-text-whisper/30 rounded-full px-5 py-3 text-text-warm placeholder:text-text-whisper focus:outline-none focus:border-ember-orange/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim() || isPaused}
              className="recording-btn-finish px-6 disabled:opacity-30"
            >
              Send
            </button>
          </form>
        </div>
      </footer>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
