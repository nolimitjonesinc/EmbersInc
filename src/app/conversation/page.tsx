'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FlameButton } from '@/components/conversation/FlameButton';
import { SessionEnding } from '@/components/conversation/SessionEnding';
import { SilenceProgressBar } from '@/components/conversation/SilenceProgressBar';
import { InactivityPrompt } from '@/components/conversation/InactivityPrompt';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { useAudioRecorder } from '@/lib/speech/useAudioRecorder';
import { useContinuousRecorder } from '@/lib/speech/useContinuousRecorder';
import { useVoiceGuidedAutoSave, detectVoiceCommand } from '@/lib/hooks/useVoiceGuidedAutoSave';
import { useVoiceCommands } from '@/lib/hooks/useVoiceCommands';
import { useTTSPlayback } from '@/lib/hooks/useTTSPlayback';
import { useConversation } from '@/lib/hooks/useConversation';
import { useStoryPersistence } from '@/lib/hooks/useStoryPersistence';
import { Message } from '@/types';
import { userStyleService } from '@/lib/services/userStyleService';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { useSubscription, getLocalStoryCount } from '@/lib/subscription/useSubscription';

// --- Constants ---

const END_PHRASES = [
  'goodbye', 'good bye', 'bye bye', 'thank you', 'thanks',
  "that's all", "that is all", "i'm done", "i am done",
  'save this', 'save my story', 'save our conversation',
  "that's all for today", "that's all for now",
];

function detectEndPhrase(text: string): boolean {
  return END_PHRASES.some((phrase) => text.toLowerCase().includes(phrase));
}

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

function generateVoiceIntroduction(
  userName?: string,
  isReturningUser?: boolean,
  mentionedPeople?: string[],
  commonThemes?: string[]
): { greeting: string; question: string } {
  if (isReturningUser && userName) {
    const returningGreetings = [
      `Welcome back, ${userName}. It's Embers. It's good to hear from you again.`,
      `Hello again, ${userName}. It's Embers. I've been thinking about your stories.`,
      `${userName}, welcome back. It's Embers. I'm glad you're here.`,
    ];
    const greeting = returningGreetings[Math.floor(Math.random() * returningGreetings.length)];

    if (mentionedPeople && mentionedPeople.length > 0) {
      const person = mentionedPeople[Math.floor(Math.random() * mentionedPeople.length)];
      return {
        greeting,
        question: `Last time you shared some wonderful stories. I'd love to hear more whenever you're ready. What memory has been on your mind lately? Or if you'd like, tell me more about ${person}.`,
      };
    }
    return { greeting, question: "What memory has been on your mind lately?" };
  }

  const newUserGreeting = userName ? `Hello, ${userName}. I'm Embers.` : "Hello. I'm Embers.";
  const introduction = `${newUserGreeting}

I'm here to help you preserve the stories and memories that matter most to you — the moments, the people, the experiences that shaped your life. Think of me as a patient friend who's genuinely curious about your life. You just talk, and I listen. I'll ask gentle questions to help your memories come alive.

There's no rush, no pressure. Just your voice, your memories, and all the time you need. Everything you share is saved safely, and when you're ready, your family can treasure these stories forever.`;

  const question = OPENING_QUESTIONS[Math.floor(Math.random() * OPENING_QUESTIONS.length)];
  return { greeting: introduction, question: `Let's start with something simple... ${question}` };
}

const INACTIVITY_TIMEOUT = 6 * 60 * 1000;

// --- Component ---

export default function ConversationPage() {
  // === Extracted hooks ===
  const conversation = useConversation();
  const tts = useTTSPlayback();
  const story = useStoryPersistence();
  const subscription = useSubscription();

  // === Page-level state ===
  const [inputText, setInputText] = useState('');
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
  const [useWhisperFallback, setUseWhisperFallback] = useState(false);
  const [hasPlayedDraftRecoveryVoice, setHasPlayedDraftRecoveryVoice] = useState(false);
  const [isPlayingDraftRecoveryVoice, setIsPlayingDraftRecoveryVoice] = useState(false);
  const [ttsFailureNotice, setTtsFailureNotice] = useState<string | null>(null);

  // === Refs ===
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleNudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoResumeRef = useRef(false);
  const introPlayedRef = useRef(false);
  const introRetryCountRef = useRef(0);
  const sendMessageRef = useRef<(content: string) => void>(() => {});
  const transcriptRef = useRef('');
  const messagesLengthRef = useRef(0);

  // === Init on mount ===
  useEffect(() => {
    const introPlayed = sessionStorage.getItem('embers_intro_played');
    if (introPlayed) {
      setHasPlayedIntro(true);
      introPlayedRef.current = true;
    }

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) setUseWhisperFallback(true);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      tts.stopAllAudio();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (idleNudgeTimerRef.current) clearTimeout(idleNudgeTimerRef.current);
    };
  }, [tts.stopAllAudio]);

  // === Timers ===
  const startIdleNudgeTimer = useCallback(() => {
    if (idleNudgeTimerRef.current) clearTimeout(idleNudgeTimerRef.current);
    idleNudgeTimerRef.current = setTimeout(() => {
      if (!tts.isSpeakingRef.current) {
        playVoicePrompt("I'm still here, take your time. Whenever you're ready, just start talking.", false);
      }
    }, 15000);
  }, [tts.isSpeakingRef]);

  const clearIdleNudgeTimer = useCallback(() => {
    if (idleNudgeTimerRef.current) {
      clearTimeout(idleNudgeTimerRef.current);
      idleNudgeTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    setShowInactivityPrompt(false);
    inactivityTimerRef.current = setTimeout(() => {
      if (conversation.messages.length >= 2) setShowInactivityPrompt(true);
    }, INACTIVITY_TIMEOUT);
  }, [conversation.messages.length]);

  // === Speech recognition ===
  const handleSilence = useCallback(() => {
    const currentTranscript = transcriptRef.current;
    if (currentTranscript && !conversation.isProcessing) {
      const voiceCommand = detectVoiceCommand(currentTranscript);
      if (voiceCommand === 'save' || voiceCommand === 'done' || voiceCommand === 'goodbye') {
        if (messagesLengthRef.current >= 2) setShowEndPrompt(true);
        return;
      }
      if (detectEndPhrase(currentTranscript)) setShowEndPrompt(true);
      sendMessageRef.current(currentTranscript);
    }
  }, [conversation.isProcessing]);

  const {
    isListening, transcript, interimTranscript, error: speechError,
    isSupported, silenceStage, silenceDuration, silenceMessage,
    startListening, stopListening, resetTranscript,
  } = useSpeechRecognition({ onSilence: handleSilence, silenceTimeout: 5000 });

  const {
    isListening: isDraftRecoveryListening,
    transcript: draftRecoveryTranscript,
    isSupported: isDraftRecoverySupported,
    startListening: startDraftRecoveryListening,
    stopListening: stopDraftRecoveryListening,
    resetTranscript: resetDraftRecoveryTranscript,
    isAffirmative,
  } = useVoiceCommands({
    continuous: false,
    enabled: story.showDraftRecovery && !isPlayingDraftRecoveryVoice,
  });

  // Keep refs in sync for silence callback
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { messagesLengthRef.current = conversation.messages.length; }, [conversation.messages.length]);

  // Audio recorder (Whisper fallback)
  const handleTranscriptionComplete = useCallback((text: string) => {
    if (text.trim()) {
      if (detectEndPhrase(text)) setShowEndPrompt(true);
      sendMessageRef.current(text);
    }
  }, []);

  const {
    isRecording, isTranscribing, formattedDuration,
    error: recorderError, startRecording, stopRecording,
  } = useAudioRecorder({
    onTranscriptionComplete: handleTranscriptionComplete,
    onError: (err) => conversation.setError(err),
  });

  // Continuous session recorder
  const {
    isRecording: isSessionRecording,
    duration: sessionDuration,
    stopRecording: stopSessionRecording,
  } = useContinuousRecorder({
    onError: (err) => console.error('Session recording error:', err),
  });

  // === Voice playback helpers ===
  const resumeListeningAfterPlayback = useCallback(() => {
    setTimeout(() => {
      if (useWhisperFallback) {
        startRecording();
      } else if (isSupported) {
        startListening();
      }
    }, 600);
  }, [useWhisperFallback, isSupported, startRecording, startListening]);

  const playVoicePrompt = useCallback(async (text: string, addAsMessage = true) => {
    if (tts.isSpeakingRef.current || conversation.isProcessing) return;

    if (addAsMessage) {
      conversation.setMessages(prev => [...prev, {
        id: 'prompt-' + Date.now(),
        role: 'assistant' as const,
        content: text,
        timestamp: new Date(),
      }]);
    }

    await tts.playText(text, {
      onEnd: () => {
        if (isSupported && !useWhisperFallback) {
          setTimeout(() => startListening(), 600);
        }
      },
    });
  }, [tts, conversation.isProcessing, isSupported, useWhisperFallback, startListening]);

  // === Auto-save hook ===
  const handleAutoSave = useCallback(async () => {
    if (conversation.messages.length < 2) return;
    const draft = {
      id: `draft-${Date.now()}`,
      messages: conversation.messages,
      savedAt: new Date().toISOString(),
      userName: localStorage.getItem('embers_user_name') || '',
    };
    localStorage.setItem('embers_conversation_draft', JSON.stringify(draft));
  }, [conversation.messages]);

  const {
    resetSilence, startSilenceTracking, stopSilenceTracking, clearDraft,
  } = useVoiceGuidedAutoSave(conversation.messages, {
    onPlayVoice: playVoicePrompt,
    onAutoSave: handleAutoSave,
    enabled: conversation.messages.length >= 2 && !tts.isSpeaking && !conversation.isProcessing,
  });

  // === Keyboard shortcuts ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Escape cancels current operation
        if (tts.isSpeaking) { tts.stopAllAudio(); }
        if (isListening) { stopListening(); }
        if (isRecording) { stopRecording(); }
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tts, isListening, isRecording, stopListening, stopRecording]);

  // === Focus management ===
  // Return focus to input after TTS finishes (unless listening resumes)
  useEffect(() => {
    if (!tts.isSpeaking && !isListening && !isRecording && !conversation.isProcessing) {
      // Small delay so auto-resume listening has a chance to fire first
      const timer = setTimeout(() => {
        if (!isListening && !isRecording) {
          inputRef.current?.focus();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tts.isSpeaking, isListening, isRecording, conversation.isProcessing]);

  // Compute voice status for screen readers
  const voiceStatus = isListening ? 'Listening...' :
    tts.isSpeaking ? 'Embers is speaking...' :
    conversation.isProcessing ? 'Gathering thoughts...' :
    isTranscribing ? 'Processing your voice...' :
    tts.isLoadingTTS ? 'Preparing to speak...' : '';

  // === Error sync ===
  useEffect(() => { if (recorderError) conversation.setError(recorderError); }, [recorderError]);
  useEffect(() => { if (speechError) conversation.setError(speechError); }, [speechError]);
  // Surface draft recovery failure as a brief notice
  useEffect(() => {
    if (story.draftRecoveryError) {
      setTtsFailureNotice(story.draftRecoveryError);
      setTimeout(() => setTtsFailureNotice(null), 6000);
    }
  }, [story.draftRecoveryError]);
  // Surface audio upload failure after save
  useEffect(() => {
    if (story.audioUploadFailed) {
      setTtsFailureNotice(ERROR_MESSAGES.savePartial);
      setTimeout(() => setTtsFailureNotice(null), 6000);
    }
  }, [story.audioUploadFailed]);

  // Auto-scroll messages
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation.messages]);

  // Reset inactivity timer on activity
  useEffect(() => {
    resetInactivityTimer();
    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); };
  }, [conversation.messages, isListening, resetInactivityTimer]);

  // === Voice introduction ===
  const playVoiceIntroduction = useCallback(async () => {
    if (introPlayedRef.current || isPlayingIntro || tts.isSpeakingRef.current) return;

    setIsPlayingIntro(true);
    introPlayedRef.current = true;
    tts.stopAllAudio();

    const cameFromOnboarding = sessionStorage.getItem('embers_came_from_onboarding');
    sessionStorage.removeItem('embers_came_from_onboarding');

    let fullIntroduction: string;

    if (cameFromOnboarding) {
      const question = OPENING_QUESTIONS[Math.floor(Math.random() * OPENING_QUESTIONS.length)];
      fullIntroduction = conversation.userName
        ? `Alright ${conversation.userName}, I'm ready to listen. ${question}`
        : `Alright, I'm ready to listen. ${question}`;
    } else {
      const { greeting, question } = generateVoiceIntroduction(
        conversation.userName,
        conversation.userContext.isReturningUser,
        conversation.userContext.frequentlyMentionedPeople,
        conversation.userContext.commonThemes
      );
      fullIntroduction = `${greeting}\n\n${question}`;
    }

    // Add intro as first message
    conversation.setMessages([{
      id: 'intro-' + Date.now(),
      role: 'assistant',
      content: fullIntroduction,
      timestamp: new Date(),
    }]);

    const markIntroDone = () => {
      setIsPlayingIntro(false);
      setHasPlayedIntro(true);
      sessionStorage.setItem('embers_intro_played', 'true');
    };

    await tts.playText(fullIntroduction, {
      onEnd: () => {
        markIntroDone();
        startIdleNudgeTimer();
        if (isSupported) setTimeout(() => startListening(), 600);
      },
      onError: () => {
        // Retry once, then fall back to text-only
        if (introRetryCountRef.current < 1) {
          introRetryCountRef.current++;
          introPlayedRef.current = false;
          setIsPlayingIntro(false);
          setTimeout(() => playVoiceIntroduction(), 500);
          return;
        }
        markIntroDone();
        setTtsFailureNotice(ERROR_MESSAGES.ttsFailed);
        setTimeout(() => setTtsFailureNotice(null), 5000);
        if (isSupported) setTimeout(() => startListening(), 600);
      },
    });
  }, [isPlayingIntro, tts, conversation, isSupported, startListening, startIdleNudgeTimer]);

  // Auto-start voice intro from onboarding
  useEffect(() => {
    const autoStart = sessionStorage.getItem('embers_auto_start_conversation');
    if (!autoStart || hasPlayedIntro || introPlayedRef.current) return;

    // Check for draft — let draft recovery handle it if present
    try {
      const draftStr = localStorage.getItem('embers_conversation_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.messages && draft.messages.length >= 2) return;
      }
    } catch (err) {
      console.warn('[Conversation] Could not check for draft during auto-start:', err);
    }

    sessionStorage.removeItem('embers_auto_start_conversation');
    const timer = setTimeout(() => playVoiceIntroduction(), 800);
    return () => clearTimeout(timer);
  }, [hasPlayedIntro, playVoiceIntroduction]);

  // === Draft recovery voice ===
  const playDraftRecoveryVoice = useCallback(async () => {
    if (hasPlayedDraftRecoveryVoice || isPlayingDraftRecoveryVoice || tts.isSpeakingRef.current) return;

    setIsPlayingDraftRecoveryVoice(true);
    setHasPlayedDraftRecoveryVoice(true);
    tts.stopAllAudio();

    const prompt = `Welcome back. You have an unsaved conversation from earlier. Say "continue" to pick up where you left off, or say "start fresh" to begin a new conversation.`;

    await tts.playText(prompt, {
      onEnd: () => {
        setIsPlayingDraftRecoveryVoice(false);
        if (isDraftRecoverySupported) {
          setTimeout(() => { resetDraftRecoveryTranscript(); startDraftRecoveryListening(); }, 500);
        }
      },
      onError: () => { setIsPlayingDraftRecoveryVoice(false); },
    });
  }, [hasPlayedDraftRecoveryVoice, isPlayingDraftRecoveryVoice, tts, isDraftRecoverySupported, resetDraftRecoveryTranscript, startDraftRecoveryListening]);

  useEffect(() => {
    if (story.showDraftRecovery && story.recoveredDraft && !hasPlayedDraftRecoveryVoice) {
      const timer = setTimeout(() => playDraftRecoveryVoice(), 500);
      return () => clearTimeout(timer);
    }
  }, [story.showDraftRecovery, story.recoveredDraft, hasPlayedDraftRecoveryVoice, playDraftRecoveryVoice]);

  // === Core handlers ===
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || conversation.isProcessing) return;

    resetInactivityTimer();
    clearIdleNudgeTimer();
    conversation.setError(null);
    setInputText('');

    const response = await conversation.sendMessage(content);
    if (response) {
      shouldAutoResumeRef.current = true;
      await tts.playText(response, {
        onEnd: () => {
          startIdleNudgeTimer();
          if (shouldAutoResumeRef.current) {
            shouldAutoResumeRef.current = false;
            resumeListeningAfterPlayback();
            startSilenceTracking();
          }
        },
        onError: () => {
          // Show text fallback notice — the response text is already in messages
          setTtsFailureNotice(ERROR_MESSAGES.ttsFailed);
          setTimeout(() => setTtsFailureNotice(null), 4000);
          if (shouldAutoResumeRef.current) {
            shouldAutoResumeRef.current = false;
            resumeListeningAfterPlayback();
          }
        },
      });
    }
  }, [conversation, tts, resetInactivityTimer, clearIdleNudgeTimer, startIdleNudgeTimer, resumeListeningAfterPlayback, startSilenceTracking]);

  // Keep ref updated for audio recorder callback
  useEffect(() => { sendMessageRef.current = handleSendMessage; });

  const handleFireClick = useCallback(() => {
    if (tts.isSpeaking || conversation.isProcessing || isPlayingIntro || tts.isLoadingTTS || isTranscribing) return;

    // First interaction: play intro
    if (conversation.messages.length === 0 && !hasPlayedIntro && !introPlayedRef.current) {
      playVoiceIntroduction();
      return;
    }

    resetSilence();
    stopSilenceTracking();

    // Web Speech API (primary)
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

    // Whisper fallback
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [tts, conversation, isPlayingIntro, isTranscribing, hasPlayedIntro, useWhisperFallback,
      isListening, isRecording, transcript, playVoiceIntroduction, resetSilence, stopSilenceTracking,
      stopListening, startListening, resetTranscript, handleSendMessage, stopRecording, startRecording]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!hasPlayedIntro) {
      setHasPlayedIntro(true);
      sessionStorage.setItem('embers_intro_played', 'true');
      introPlayedRef.current = true;
    }
    if (detectEndPhrase(inputText)) setShowEndPrompt(true);
    handleSendMessage(inputText);
  }, [inputText, hasPlayedIntro, handleSendMessage]);

  const handleSaveStory = useCallback(async () => {
    if (conversation.messages.length < 2) {
      conversation.setError('Have a conversation first.');
      return;
    }

    conversation.setError(null);
    setShowEndPrompt(false);
    setShowInactivityPrompt(false);
    stopListening();
    stopSilenceTracking();
    tts.stopAllAudio();

    try {
      await story.saveStory(conversation.messages, {
        stopSessionRecording: stopSessionRecording,
        sessionDuration,
        isSessionRecording,
      });
      clearDraft();
    } catch (err) {
      conversation.setError(err instanceof Error ? err.message : 'Failed to save story.');
    }
  }, [conversation, story, tts, stopListening, stopSilenceTracking, clearDraft,
      stopSessionRecording, sessionDuration, isSessionRecording]);

  const handleNewConversation = useCallback(() => {
    conversation.resetConversation();
    story.resetStoryState();
    setShowEndPrompt(false);
    setHasPlayedIntro(false);
    introPlayedRef.current = false;
    sessionStorage.removeItem('embers_intro_played');
    clearDraft();
    stopSilenceTracking();
    resetSilence();
  }, [conversation, story, clearDraft, stopSilenceTracking, resetSilence]);

  // Draft recovery handlers
  const handleRecoverDraft = useCallback(() => {
    const messages = story.recoverDraft();
    if (messages) {
      conversation.setMessages(messages);
      setHasPlayedIntro(true);
      introPlayedRef.current = true;
      sessionStorage.setItem('embers_intro_played', 'true');
    }
    tts.stopAllAudio();
  }, [story, conversation, tts]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    story.discardDraft();
    tts.stopAllAudio();
  }, [clearDraft, story, tts]);

  // Process draft recovery voice commands
  useEffect(() => {
    if (!draftRecoveryTranscript || isPlayingDraftRecoveryVoice || !story.showDraftRecovery) return;
    const lower = draftRecoveryTranscript.toLowerCase().trim();

    if (lower.includes('continue') || isAffirmative(lower)) {
      stopDraftRecoveryListening();
      handleRecoverDraft();
    } else if (lower.includes('start fresh') || lower.includes('fresh') || lower.includes('new') || lower.includes('no')) {
      stopDraftRecoveryListening();
      handleDiscardDraft();
    }
  }, [draftRecoveryTranscript, isPlayingDraftRecoveryVoice, story.showDraftRecovery,
      isAffirmative, stopDraftRecoveryListening, handleRecoverDraft, handleDiscardDraft]);

  // === Session ending ===
  if (story.showSessionEnding) {
    const style = userStyleService.getStyle();
    const currentCount = subscription.isAuthenticated
      ? story.savedStoriesCount
      : getLocalStoryCount();
    return (
      <SessionEnding
        userName={conversation.userName}
        storyId={story.savedStoryId || undefined}
        storyTitle={story.savedStoryTitle || undefined}
        mentionedPeople={style.frequentlyMentionedPeople}
        themes={Object.keys(style.commonThemes).slice(0, 5)}
        conversationSummary={story.conversationSummary || undefined}
        onNewStory={handleNewConversation}
        showAuthGate={subscription.shouldShowAuthGate(currentCount)}
        showUpgradePrompt={subscription.shouldShowUpgradePrompt(currentCount)}
        storiesCount={currentCount}
        onAuthSuccess={() => window.location.reload()}
      />
    );
  }

  // === JSX ===
  const hasActiveInput = transcript || interimTranscript;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0908] relative overflow-hidden">
      {/* Screen reader: voice status announcements */}
      <div aria-live="polite" role="status" className="sr-only">
        {voiceStatus}
      </div>
      {/* Screen reader: error announcements */}
      <div aria-live="assertive" role="alert" className="sr-only">
        {conversation.error || ttsFailureNotice || ''}
      </div>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[70%]"
          style={{
            background: `radial-gradient(ellipse at center bottom,
              rgba(232, 109, 72, ${isListening ? 0.15 : tts.isSpeaking ? 0.12 : 0.08}) 0%,
              rgba(196, 90, 58, ${isListening ? 0.08 : tts.isSpeaking ? 0.06 : 0.04}) 30%,
              transparent 60%)`,
            transition: 'all 1s ease-out',
          }}
        />
      </div>

      {/* Inactivity prompt */}
      <InactivityPrompt
        isVisible={showInactivityPrompt}
        onContinue={() => { setShowInactivityPrompt(false); resetInactivityTimer(); }}
        onSaveAndExit={handleSaveStory}
      />

      {/* Draft recovery prompt */}
      {story.showDraftRecovery && story.recoveredDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0a0908]/90 backdrop-blur-sm" />
          <div className="relative bg-[#151312] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center">
            {isDraftRecoveryListening && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-full px-4 py-1 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[#f9f7f2]/80 text-xs">Listening...</span>
              </div>
            )}
            {isPlayingDraftRecoveryVoice && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-full px-4 py-1">
                <span className="text-[#f9f7f2]/80 text-xs animate-pulse">Embers is speaking...</span>
              </div>
            )}
            <h3 className="text-xl font-serif text-[#f9f7f2] mb-3">Welcome back</h3>
            <p className="text-sm text-[#f9f7f2]/50 mb-2">You have an unsaved conversation from earlier.</p>
            <p className="text-xs text-[#f9f7f2]/30 mb-3">
              Saved {new Date(story.recoveredDraft.savedAt).toLocaleString()}
            </p>
            <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-xl p-3 mb-4">
              <p className="text-[#f9f7f2]/70 text-sm">
                Say <span className="text-[#E86D48] font-semibold">&ldquo;continue&rdquo;</span> or{' '}
                <span className="text-[#E86D48] font-semibold">&ldquo;start fresh&rdquo;</span>
              </p>
            </div>
            {isDraftRecoveryListening && draftRecoveryTranscript && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-4">
                <p className="text-[#f9f7f2]/60 text-sm">&ldquo;{draftRecoveryTranscript}&rdquo;</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleDiscardDraft} className="flex-1 py-3 rounded-full text-[#f9f7f2]/60 border border-white/10 hover:bg-white/5 text-sm">
                Start Fresh
              </button>
              <button onClick={handleRecoverDraft} className="flex-1 py-3 rounded-full text-white text-sm" style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End prompt */}
      {showEndPrompt && conversation.messages.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0a0908]/90 backdrop-blur-sm" />
          <div className="relative bg-[#151312] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center">
            <h3 className="text-xl font-serif text-[#f9f7f2] mb-3">Save your story?</h3>
            <p className="text-sm text-[#f9f7f2]/50 mb-4">Thank you for sharing. Would you like to preserve this memory?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEndPrompt(false)} className="flex-1 py-3 rounded-full text-[#f9f7f2]/60 border border-white/10 hover:bg-white/5 text-sm">Keep Going</button>
              <button onClick={handleSaveStory} disabled={story.isSaving} className="flex-1 py-3 rounded-full text-white text-sm" style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}>
                {story.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-700 ${isListening || tts.isSpeaking || isRecording ? 'opacity-20' : 'opacity-100'}`}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-serif text-[#f9f7f2]/50 hover:text-[#f9f7f2]/80 transition-colors">Embers</Link>
          <div className="flex items-center gap-4">
            {conversation.messages.length >= 2 && (
              <button onClick={handleSaveStory} disabled={story.isSaving} className="text-xs py-2 px-4 rounded-full border border-[#E86D48]/30 text-[#E86D48]/80 hover:bg-[#E86D48]/10">
                {story.isSaving ? 'Saving...' : 'Save Story'}
              </button>
            )}
            <Link href="/life-book" className="text-[#f9f7f2]/50 hover:text-[#f9f7f2]/80 text-sm">My Stories</Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 flex flex-col justify-end relative z-10">
        {conversation.messages.length > 0 && (
          <div className="flex-1 overflow-y-auto pt-20 pb-4 px-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {conversation.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-[#E86D48]/15 border border-[#E86D48]/20' : 'bg-white/5 border border-white/5'}`}>
                    <p className="text-base leading-relaxed font-serif text-[#f9f7f2]/90 whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              {hasActiveInput && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-[#E86D48]/10 border border-dashed border-[#E86D48]/30">
                    <p className="text-base font-serif text-[#f9f7f2]/60">{transcript}<span className="opacity-40">{interimTranscript}</span></p>
                  </div>
                </div>
              )}
              {(conversation.isProcessing || tts.isLoadingTTS || isTranscribing) && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3">
                    <p className="text-[#f9f7f2]/60 font-serif text-sm animate-pulse">
                      {conversation.isProcessing ? 'Gathering my thoughts...' : isTranscribing ? 'Listening to your story...' : (tts.warmLoadingMessage || 'Embers is listening...')}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Fire area */}
        <div className={`relative flex flex-col items-center justify-end transition-all duration-700 ${conversation.messages.length === 0 ? 'h-[70vh]' : 'h-[40vh] min-h-[280px]'}`}>
          {/* Welcome text */}
          {conversation.messages.length === 0 && !isPlayingIntro && !tts.isSpeaking && (
            <div className="absolute top-12 left-0 right-0 text-center px-6">
              <h1 className="text-3xl md:text-4xl font-serif text-[#f9f7f2]/90 mb-4">
                {conversation.userName ? (conversation.userContext.isReturningUser ? `Welcome back, ${conversation.userName}` : `Hello, ${conversation.userName}`) : 'Hello'}
              </h1>
              <p className="text-lg text-[#f9f7f2]/60 max-w-md mx-auto font-serif italic leading-relaxed">
                {conversation.starterPrompt}
              </p>
              <p className="text-sm text-[#f9f7f2]/50 mt-6">Tap the flame to begin</p>
            </div>
          )}

          {/* Speaking/Loading indicator */}
          {(tts.isSpeaking || tts.isLoadingTTS) && conversation.messages.length <= 1 && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                {tts.isLoadingTTS ? (tts.warmLoadingMessage || 'Embers is listening...') : 'Embers is speaking...'}
              </p>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <div className="inline-flex items-center gap-3 bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-full px-6 py-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <p className="text-lg text-[#f9f7f2]/90 font-serif">Recording {formattedDuration}</p>
              </div>
              <p className="text-sm text-[#f9f7f2]/60 mt-3 font-serif">Tap the flame when you&apos;re finished</p>
            </div>
          )}

          {/* Transcribing indicator */}
          {isTranscribing && (
            <div className="absolute top-16 left-0 right-0 text-center px-6">
              <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">Listening to your story...</p>
            </div>
          )}

          {/* The fire */}
          <div className="mb-8">
            <FlameButton
              isListening={isListening || isRecording}
              isSpeaking={tts.isSpeaking}
              isProcessing={conversation.isProcessing || isTranscribing}
              isLoadingTTS={tts.isLoadingTTS}
              onClick={handleFireClick}
              size={conversation.messages.length === 0 ? 'large' : 'medium'}
              showEmberCount={story.savedStoriesCount}
            />
          </div>

          {/* Silence indicator */}
          {!useWhisperFallback && isListening && hasActiveInput && silenceStage !== 'none' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <SilenceProgressBar stage={silenceStage} progress={silenceDuration} message={silenceMessage} isVisible={true} />
            </div>
          )}
        </div>
      </main>

      {/* Error */}
      {conversation.error && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-center text-red-400 text-sm">{conversation.error}</p>
          </div>
        </div>
      )}

      {/* TTS failure notice */}
      {ttsFailureNotice && !conversation.error && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-md mx-auto bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-center text-amber-400 text-sm">{ttsFailureNotice}</p>
          </div>
        </div>
      )}

      {/* Text input */}
      <footer className="relative z-20 pb-8 pt-4 px-6">
        <form onSubmit={handleTextSubmit} className="max-w-xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="or type here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={conversation.isProcessing || tts.isSpeaking || isRecording || isTranscribing}
            aria-label="Type your message"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-[#f9f7f2]/90 placeholder:text-[#f9f7f2]/40 focus:outline-none focus:border-[#E86D48]/30 text-sm"
          />
          <button
            type="submit"
            disabled={conversation.isProcessing || tts.isSpeaking || isRecording || isTranscribing || !inputText.trim()}
            className="px-5 py-3 rounded-full text-sm disabled:opacity-30 bg-[#E86D48]/20 border border-[#E86D48]/20 text-[#E86D48]/80 hover:bg-[#E86D48]/30"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
