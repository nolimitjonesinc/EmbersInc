'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FlameButton } from '@/components/conversation/FlameButton';
import { SessionEnding } from '@/components/conversation/SessionEnding';
import { SilenceProgressBar } from '@/components/conversation/SilenceProgressBar';
import { InactivityPrompt } from '@/components/conversation/InactivityPrompt';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { useAudioRecorder } from '@/lib/speech/useAudioRecorder';
import { Message } from '@/types';
import { interestService } from '@/lib/services/interestService';
import { userStyleService } from '@/lib/services/userStyleService';
import { getPromptsForInterests, getRandomWarmPrompt } from '@/lib/prompts/promptSelector';

const END_PHRASES = [
  'goodbye', 'good bye', 'bye bye', 'thank you', 'thanks',
  "that's all", "that is all", "i'm done", "i am done",
  'save this', 'save my story', 'save our conversation',
  "that's all for today", "that's all for now",
];

function detectEndPhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  return END_PHRASES.some((phrase) => lowerText.includes(phrase));
}

// Warm, empathetic loading messages that rotate randomly
const WARM_LOADING_MESSAGES = [
  "Ember is listening...",
  "Taking it all in...",
  "Gathering my thoughts...",
  "Reflecting on what you shared...",
  "Just a moment...",
  "Holding space for you...",
  "With you shortly...",
  "Savoring your words...",
];

function getRandomWarmMessage(): string {
  return WARM_LOADING_MESSAGES[Math.floor(Math.random() * WARM_LOADING_MESSAGES.length)];
}

// Sensory-based opening questions - low emotional stakes, easy to answer
const OPENING_QUESTIONS = [
  "What's a smell that instantly takes you back to a happy moment?",
  "What sound from your childhood can you still hear perfectly in your mind?",
  "If you close your eyes and think of your childhood home, what's the first thing you see?",
  "Who's someone whose laugh you can still hear?",
  "What's a taste that brings back memories for you?",
  "What song takes you right back to a specific moment in your life?",
  "Tell me about a place that always felt safe to you.",
  "What's something small that a loved one did that you'll never forget?",
];

// Generate personalized greeting based on user context
function generateVoiceIntroduction(
  userName?: string,
  isReturningUser?: boolean,
  mentionedPeople?: string[],
  commonThemes?: string[]
): { greeting: string; question: string } {
  // Returning user with context
  if (isReturningUser && userName) {
    const returningGreetings = [
      `Welcome back, ${userName}. It's good to hear from you again.`,
      `Hello again, ${userName}. I've been thinking about your stories.`,
      `${userName}, welcome back. I'm glad you're here.`,
    ];

    let greeting = returningGreetings[Math.floor(Math.random() * returningGreetings.length)];

    // Personalize with mentioned people if available
    if (mentionedPeople && mentionedPeople.length > 0) {
      const person = mentionedPeople[Math.floor(Math.random() * mentionedPeople.length)];
      return {
        greeting,
        question: `Last time you shared some wonderful stories. I'd love to hear more whenever you're ready. What memory has been on your mind lately? Or if you'd like, tell me more about ${person}.`
      };
    }

    return {
      greeting,
      question: "What memory has been on your mind lately?"
    };
  }

  // New user introduction
  const newUserGreeting = userName
    ? `Hello, ${userName}. I'm Ember.`
    : "Hello. I'm Ember.";

  const introduction = `${newUserGreeting}

I'm here to help you capture the stories and memories that matter most to you. There's no pressure, no right or wrong way to do this. Just your voice, your memories, and all the time you need.

Think of me as a friend who's genuinely curious about your life. I'll ask questions, and you share whatever comes to mind.`;

  const question = OPENING_QUESTIONS[Math.floor(Math.random() * OPENING_QUESTIONS.length)];

  return {
    greeting: introduction,
    question: `Let's start with something simple... ${question}`
  };
}

const INACTIVITY_TIMEOUT = 6 * 60 * 1000;

// Generate a brief summary of what was shared
function generateConversationSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';

  // Extract key content from user messages
  const content = userMessages.map(m => m.content).join(' ');

  // Keep it brief - first 2-3 sentences worth
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summaryParts = sentences.slice(0, 3).map(s => s.trim());

  if (summaryParts.length === 0) return content.slice(0, 200);

  let summary = summaryParts.join('. ');
  if (summary.length > 300) {
    summary = summary.slice(0, 297) + '...';
  }
  if (!summary.endsWith('.') && !summary.endsWith('...')) {
    summary += '.';
  }

  return summary;
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [savedStoryTitle, setSavedStoryTitle] = useState<string | null>(null);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [showSessionEnding, setShowSessionEnding] = useState(false);
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);
  const [warmLoadingMessage, setWarmLoadingMessage] = useState('');
  // Hybrid approach: Web Speech API is primary (free), Whisper is backup
  // Will auto-switch to Whisper if Web Speech API isn't supported
  const [useWhisperFallback, setUseWhisperFallback] = useState(false);

  // Voice introduction state
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Personalization state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userContext, setUserContext] = useState<{
    isReturningUser: boolean;
    frequentlyMentionedPeople: string[];
    preferredTimeframes: string[];
    commonThemes: string[];
  }>({
    isReturningUser: false,
    frequentlyMentionedPeople: [],
    preferredTimeframes: [],
    commonThemes: []
  });
  const [starterPrompt, setStarterPrompt] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoResumeRef = useRef(false);
  const introPlayedRef = useRef(false);
  const sendMessageRef = useRef<(content: string) => void>(() => {});

  // Load user data on mount
  useEffect(() => {
    // Check if intro was already played this session
    const introPlayed = sessionStorage.getItem('embers_intro_played');
    if (introPlayed) {
      setHasPlayedIntro(true);
      introPlayedRef.current = true;
    }

    // Load name
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) setUserName(storedName);

    // Load selected interests
    const interests = interestService.get();
    setSelectedInterests(interests);

    // Load user context (returning user, mentioned people, themes)
    const context = userStyleService.getContext();
    setUserContext(context);

    // Generate personalized starter prompt for display
    let prompt: string;
    if (interests.length > 0) {
      const matchingPrompts = getPromptsForInterests(interests);
      const randomPrompt = matchingPrompts[Math.floor(Math.random() * matchingPrompts.length)];
      prompt = randomPrompt.question;
    } else {
      prompt = getRandomWarmPrompt().question;
    }
    setStarterPrompt(prompt);

    // Fetch stories count
    const fetchStoriesCount = async () => {
      try {
        const response = await fetch('/api/stories');
        if (response.ok) {
          const data = await response.json();
          setSavedStoriesCount(data.stories?.length || 0);
        }
      } catch { /* ignore */ }
    };
    fetchStoriesCount();

    // Check if Web Speech API is supported - if not, use Whisper fallback
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setUseWhisperFallback(true);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    setShowInactivityPrompt(false);
    inactivityTimerRef.current = setTimeout(() => {
      if (messages.length >= 2) setShowInactivityPrompt(true);
    }, INACTIVITY_TIMEOUT);
  }, [messages.length]);

  const handleSilence = useCallback(() => {
    if (transcript && !isProcessing) {
      if (detectEndPhrase(transcript)) setShowEndPrompt(true);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, []);

  const {
    isListening, transcript, interimTranscript, error: speechError,
    isSupported, silenceStage, silenceDuration, silenceMessage,
    startListening, stopListening, resetTranscript,
  } = useSpeechRecognition({ onSilence: handleSilence, silenceTimeout: 5000 });

  // Reliable audio recorder (continuous recording with Whisper transcription)
  const handleTranscriptionComplete = useCallback((text: string) => {
    if (text.trim()) {
      if (detectEndPhrase(text)) setShowEndPrompt(true);
      sendMessageRef.current(text);
    }
  }, []);

  const {
    isRecording,
    isTranscribing,
    formattedDuration,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder({
    onTranscriptionComplete: handleTranscriptionComplete,
    onError: (err) => setError(err),
  });

  useEffect(() => {
    if (recorderError) setError(recorderError);
  }, [recorderError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (speechError) setError(speechError);
  }, [speechError]);

  useEffect(() => {
    resetInactivityTimer();
    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); };
  }, [messages, isListening, resetInactivityTimer]);

  // Name detection from conversation
  useEffect(() => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      const prevMsg = messages[messages.length - 2];
      if (prevMsg?.role === 'assistant' && prevMsg.content.toLowerCase().includes('name') && lastUserMessage?.role === 'user') {
        const match = lastUserMessage.content.match(/(?:i'm|i am|my name is|call me)\s+(\w+)/i) || lastUserMessage.content.match(/^(\w+)$/i);
        if (match?.[1]) {
          const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          setUserName(name);
          localStorage.setItem('embers_user_name', name);
        }
      }
    }
  }, [messages]);

  // Play voice introduction
  const playVoiceIntroduction = async () => {
    if (introPlayedRef.current || isPlayingIntro) return;

    setIsPlayingIntro(true);
    introPlayedRef.current = true;

    const { greeting, question } = generateVoiceIntroduction(
      userName,
      userContext.isReturningUser,
      userContext.frequentlyMentionedPeople,
      userContext.commonThemes
    );

    const fullIntroduction = `${greeting}\n\n${question}`;

    // Add intro as first assistant message
    const introMessage: Message = {
      id: 'intro-' + Date.now(),
      role: 'assistant',
      content: fullIntroduction,
      timestamp: new Date()
    };
    setMessages([introMessage]);

    // Play the audio
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullIntroduction })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setIsPlayingIntro(false);
        setHasPlayedIntro(true);
        sessionStorage.setItem('embers_intro_played', 'true');
        URL.revokeObjectURL(audioUrl);

        // Automatically start listening after intro finishes
        if (isSupported) {
          setTimeout(() => startListening(), 600);
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsPlayingIntro(false);
        setHasPlayedIntro(true);
        sessionStorage.setItem('embers_intro_played', 'true');
        URL.revokeObjectURL(audioUrl);

        // Still try to start listening
        if (isSupported) {
          setTimeout(() => startListening(), 600);
        }
      };

      await audio.play();
    } catch {
      setIsSpeaking(false);
      setIsPlayingIntro(false);
      setHasPlayedIntro(true);
      sessionStorage.setItem('embers_intro_played', 'true');

      // Start listening even if TTS failed
      if (isSupported) {
        setTimeout(() => startListening(), 600);
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    resetInactivityTimer();

    // Process the message through style analyzer
    const updatedStyle = userStyleService.processMessage(content);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: content.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Send with full context for personalization
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userName,
          isFirstMessage: messages.filter(m => m.role === 'user').length === 0,
          selectedInterests,
          isReturningUser: userContext.isReturningUser,
          frequentlyMentionedPeople: updatedStyle.frequentlyMentionedPeople,
          preferredTimeframes: updatedStyle.preferredTimeframes,
          commonThemes: Object.keys(updatedStyle.commonThemes).slice(0, 5)
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message, timestamp: new Date() }]);
      shouldAutoResumeRef.current = true;
      await playAudio(data.message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep ref updated for audio recorder callback
  useEffect(() => {
    sendMessageRef.current = handleSendMessage;
  });

  const playAudio = async (text: string) => {
    try {
      setIsLoadingTTS(true);
      setWarmLoadingMessage(getRandomWarmMessage());
      const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!response.ok) throw new Error('TTS failed');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Auto-start recording after Ember finishes speaking
        if (shouldAutoResumeRef.current) {
          shouldAutoResumeRef.current = false;
          setTimeout(() => {
            if (useWhisperFallback) {
              startRecording();
            } else if (isSupported) {
              startListening();
            }
          }, 600);
        }
      };
      audio.onerror = () => { setIsSpeaking(false); setIsLoadingTTS(false); setWarmLoadingMessage(''); URL.revokeObjectURL(audioUrl); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      if (shouldAutoResumeRef.current) {
        shouldAutoResumeRef.current = false;
        setTimeout(() => {
          if (useWhisperFallback) {
            startRecording();
          } else if (isSupported) {
            startListening();
          }
        }, 600);
      }
    }
  };

  const handleFireClick = () => {
    if (isSpeaking || isProcessing || isPlayingIntro || isLoadingTTS || isTranscribing) return;

    // If this is the first interaction and intro hasn't played, play it
    if (messages.length === 0 && !hasPlayedIntro && !introPlayedRef.current) {
      playVoiceIntroduction();
      return;
    }

    // Primary: Web Speech API (free, robust with auto-restart)
    if (!useWhisperFallback) {
      if (isListening) {
        stopListening();
        if (transcript) { handleSendMessage(transcript); resetTranscript(); }
      } else {
        resetTranscript();
        startListening();
      }
      return;
    }

    // Fallback: Whisper transcription (when Web Speech API not supported)
    if (isRecording) {
      stopRecording(); // Will transcribe and send automatically
    } else {
      startRecording();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      // If intro hasn't played yet, mark it as played since user is typing
      if (!hasPlayedIntro) {
        setHasPlayedIntro(true);
        sessionStorage.setItem('embers_intro_played', 'true');
        introPlayedRef.current = true;
      }
      if (detectEndPhrase(inputText)) setShowEndPrompt(true);
      handleSendMessage(inputText);
    }
  };

  const handleSaveStory = async () => {
    if (messages.length < 2) { setError('Have a conversation first.'); return; }
    setIsSaving(true);
    setError(null);
    setShowEndPrompt(false);
    setShowInactivityPrompt(false);
    stopListening();
    if (audioRef.current) audioRef.current.pause();

    try {
      const content = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messages, generateNarrative: true, generateTitle: true }),
      });
      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      setSavedStoryId(data.story.id);
      setSavedStoryTitle(data.story.title || null);
      setSavedStoriesCount(prev => prev + 1);

      // Generate summary of what was shared
      const summary = generateConversationSummary(messages);
      setConversationSummary(summary);

      // Record the story in session data
      const style = userStyleService.getStyle();
      userStyleService.recordStory(Object.keys(style.commonThemes));

      setShowSessionEnding(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setSavedStoryId(null);
    setError(null);
    setShowSessionEnding(false);
    setShowEndPrompt(false);
    setHasPlayedIntro(false);
    introPlayedRef.current = false;
    sessionStorage.removeItem('embers_intro_played');

    // Generate a new starter prompt
    const interests = interestService.get();
    let prompt: string;
    if (interests.length > 0) {
      const matchingPrompts = getPromptsForInterests(interests);
      const randomPrompt = matchingPrompts[Math.floor(Math.random() * matchingPrompts.length)];
      prompt = randomPrompt.question;
    } else {
      prompt = getRandomWarmPrompt().question;
    }
    setStarterPrompt(prompt);
  };

  if (showSessionEnding) {
    const style = userStyleService.getStyle();
    return (
      <SessionEnding
        userName={userName}
        storyId={savedStoryId || undefined}
        storyTitle={savedStoryTitle || undefined}
        mentionedPeople={style.frequentlyMentionedPeople}
        themes={Object.keys(style.commonThemes).slice(0, 5)}
        conversationSummary={conversationSummary || undefined}
        onNewStory={handleNewConversation}
      />
    );
  }

  const hasActiveInput = transcript || interimTranscript;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0908] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[70%]"
          style={{
            background: `radial-gradient(ellipse at center bottom,
              rgba(232, 109, 72, ${isListening ? 0.15 : isSpeaking ? 0.12 : 0.08}) 0%,
              rgba(196, 90, 58, ${isListening ? 0.08 : isSpeaking ? 0.06 : 0.04}) 30%,
              transparent 60%)`,
            transition: 'all 1s ease-out',
          }}
        />
      </div>

      {/* Inactivity prompt */}
      <InactivityPrompt isVisible={showInactivityPrompt} onContinue={() => { setShowInactivityPrompt(false); resetInactivityTimer(); }} onSaveAndExit={handleSaveStory} />

      {/* End prompt */}
      {showEndPrompt && messages.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0a0908]/90 backdrop-blur-sm" />
          <div className="relative bg-[#151312] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center">
            <h3 className="text-xl font-serif text-[#f9f7f2] mb-3">Save your story?</h3>
            <p className="text-sm text-[#f9f7f2]/50 mb-4">
              Thank you for sharing. Would you like to preserve this memory?
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEndPrompt(false)} className="flex-1 py-3 rounded-full text-[#f9f7f2]/60 border border-white/10 hover:bg-white/5 text-sm">Keep Going</button>
              <button onClick={handleSaveStory} disabled={isSaving} className="flex-1 py-3 rounded-full text-white text-sm" style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-700 ${isListening || isSpeaking || isRecording ? 'opacity-20' : 'opacity-100'}`}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-serif text-[#f9f7f2]/50 hover:text-[#f9f7f2]/80 transition-colors">Embers</Link>
          <div className="flex items-center gap-4">
            {messages.length >= 2 && (
              <button onClick={handleSaveStory} disabled={isSaving} className="text-xs py-2 px-4 rounded-full border border-[#E86D48]/30 text-[#E86D48]/80 hover:bg-[#E86D48]/10">
                {isSaving ? 'Saving...' : 'Save Story'}
              </button>
            )}
            <Link href="/life-book" className="text-[#f9f7f2]/30 hover:text-[#f9f7f2]/60 text-sm">My Stories</Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-end relative z-10">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto pt-20 pb-4 px-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-[#E86D48]/15 border border-[#E86D48]/20' : 'bg-white/5 border border-white/5'}`}>
                    <p className="text-[15px] leading-relaxed font-serif text-[#f9f7f2]/90 whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              {hasActiveInput && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-[#E86D48]/10 border border-dashed border-[#E86D48]/30">
                    <p className="text-[15px] font-serif text-[#f9f7f2]/60">{transcript}<span className="opacity-40">{interimTranscript}</span></p>
                  </div>
                </div>
              )}
              {(isProcessing || isLoadingTTS || isTranscribing) && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3">
                    <p className="text-[#f9f7f2]/40 font-serif text-sm animate-pulse">
                      {isProcessing ? 'Gathering my thoughts...' : isTranscribing ? 'Listening to your story...' : (warmLoadingMessage || 'Ember is listening...')}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Fire area */}
        <div className={`relative flex flex-col items-center justify-end transition-all duration-700 ${messages.length === 0 ? 'h-[70vh]' : 'h-[40vh] min-h-[280px]'}`}>
          {/* Welcome text - only show before intro plays */}
          {messages.length === 0 && !isPlayingIntro && !isSpeaking && (
            <div className="absolute top-12 left-0 right-0 text-center px-6">
              <h1 className="text-3xl md:text-4xl font-serif text-[#f9f7f2]/90 mb-4">
                {userName ? (userContext.isReturningUser ? `Welcome back, ${userName}` : `Hello, ${userName}`) : 'Hello'}
              </h1>
              <p className="text-lg text-[#f9f7f2]/40 max-w-md mx-auto font-serif italic leading-relaxed">
                {starterPrompt}
              </p>
              {/* Tap to start hint */}
              <p className="text-sm text-[#f9f7f2]/20 mt-6">
                Tap the flame to begin
              </p>
            </div>
          )}

          {/* Speaking/Loading indicator when Ember is talking or preparing to speak */}
          {(isSpeaking || isLoadingTTS) && messages.length <= 1 && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                {isLoadingTTS ? (warmLoadingMessage || 'Ember is listening...') : 'Ember is speaking...'}
              </p>
            </div>
          )}

          {/* Recording indicator - prominent for elderly users */}
          {isRecording && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <div className="inline-flex items-center gap-3 bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-full px-6 py-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <p className="text-lg text-[#f9f7f2]/90 font-serif">
                  Recording {formattedDuration}
                </p>
              </div>
              <p className="text-sm text-[#f9f7f2]/40 mt-3 font-serif">
                Tap the flame when you&apos;re finished
              </p>
            </div>
          )}

          {/* Transcribing indicator */}
          {isTranscribing && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                Listening to your story...
              </p>
            </div>
          )}

          {/* The fire */}
          <div className="mb-8">
            <FlameButton
              isListening={isListening || isRecording}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing || isTranscribing}
              isLoadingTTS={isLoadingTTS}
              onClick={handleFireClick}
              size={messages.length === 0 ? 'large' : 'medium'}
              showEmberCount={savedStoriesCount}
            />
          </div>

          {/* Silence indicator - only for Web Speech API mode */}
          {!useWhisperFallback && isListening && hasActiveInput && silenceStage !== 'none' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <SilenceProgressBar stage={silenceStage} progress={silenceDuration} message={silenceMessage} isVisible={true} />
            </div>
          )}
        </div>
      </main>

      {/* Error */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-center text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Text input */}
      <footer className="relative z-20 pb-8 pt-4 px-6">
        <form onSubmit={handleTextSubmit} className="max-w-xl mx-auto flex gap-3">
          <input
            type="text"
            placeholder="or type here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing || isSpeaking || isRecording || isTranscribing}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-[#f9f7f2]/90 placeholder:text-[#f9f7f2]/20 focus:outline-none focus:border-[#E86D48]/30 text-sm"
          />
          <button type="submit" disabled={isProcessing || isSpeaking || isRecording || isTranscribing || !inputText.trim()} className="px-5 py-3 rounded-full text-sm disabled:opacity-30 bg-[#E86D48]/20 border border-[#E86D48]/20 text-[#E86D48]/80 hover:bg-[#E86D48]/30">
            Send
          </button>
        </form>
      </footer>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
