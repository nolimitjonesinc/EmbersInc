'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Message } from '@/types';
import { type SyncStatus } from '@/lib/storage/dualStorage';
import {
  saveConversationDraft,
  loadConversationDraft,
  clearConversationDraft,
} from '@/lib/conversation/draftStorage';

/**
 * Voice-Guided Auto-Save Hook
 *
 * Provides tiered silence detection with voice prompts for elderly users:
 * - 30 seconds: Gentle check-in ("Take your time...")
 * - 60 seconds: Ask about saving ("Would you like me to save...?")
 * - 90 seconds: Auto-save draft and announce
 *
 * Also handles:
 * - Auto-draft saving to localStorage every 5 seconds (crash cushion)
 * - Emergency saves on blur, visibility change, and beforeunload
 * - Cloud sync to Supabase every 30 seconds (best-effort)
 * - Voice command recognition (save, done, goodbye)
 * - Draft recovery on page load
 */

export interface SilencePrompt {
  type: 'gentle' | 'save-offer' | 'auto-saved';
  message: string;
}

export interface AutoSaveState {
  hasDraft: boolean;
  lastSavedAt: Date | null;
  draftId: string | null;
}

interface UseVoiceGuidedAutoSaveOptions {
  onPlayVoice: (text: string) => Promise<void>;
  onAutoSave: () => Promise<void>;
  onSilencePrompt?: (prompt: SilencePrompt) => void;
  enabled?: boolean;
  enableSupabaseDrafts?: boolean;
}

// Silence thresholds in milliseconds
const SILENCE_THRESHOLDS = {
  GENTLE_CHECKIN: 30 * 1000,
  SAVE_OFFER: 60 * 1000,
  AUTO_SAVE: 90 * 1000,
};

// Local autosave runs every 5s — crash cushion, no network needed
const LOCAL_SAVE_INTERVAL = 5 * 1000;
// Supabase sync runs every 30s — best-effort, separate from local
const CLOUD_SYNC_INTERVAL = 30 * 1000;

const SILENCE_PROMPTS = {
  gentle: [
    "Take your time. I'm here when you're ready.",
    "No rush at all. I'm listening whenever you'd like to continue.",
    "I'm right here. Share whenever you're ready.",
  ],
  saveOffer: [
    "Would you like me to save this story? Just say 'save' or keep sharing when you're ready.",
    "Should I save what we've captured so far? Say 'save' anytime, or continue when you're ready.",
    "We've shared some wonderful memories. Say 'save' to keep them safe, or keep going.",
  ],
  autoSaved: [
    "I've protected your story on this device. You can come back anytime to continue. Say 'goodbye' when you're done, or keep sharing.",
    "Don't worry, I've kept everything we've talked about safe on this device. Take your time, or say 'goodbye' to finish.",
    "Your memories are protected on this device. Continue whenever you're ready, or say 'goodbye' to end our conversation.",
  ],
};

export const VOICE_COMMANDS = {
  SAVE: ['save', 'save my story', 'save this', 'save it', 'keep this'],
  DONE: ['done', "i'm done", 'i am done', 'finished', "i'm finished", 'i am finished', "that's all", 'that is all'],
  GOODBYE: ['goodbye', 'bye', 'bye bye', 'bye ember', 'goodbye ember', 'see you', 'see you later'],
};

function getRandomPrompt(prompts: string[]): string {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function detectVoiceCommand(text: string): 'save' | 'done' | 'goodbye' | null {
  const lowerText = text.toLowerCase().trim();
  if (VOICE_COMMANDS.GOODBYE.some(cmd => lowerText.includes(cmd))) return 'goodbye';
  if (VOICE_COMMANDS.SAVE.some(cmd => lowerText.includes(cmd))) return 'save';
  if (VOICE_COMMANDS.DONE.some(cmd => lowerText.includes(cmd))) return 'done';
  return null;
}

export function useVoiceGuidedAutoSave(
  messages: Message[],
  options: UseVoiceGuidedAutoSaveOptions
) {
  const { onPlayVoice, onAutoSave, onSilencePrompt, enabled = true, enableSupabaseDrafts = true } = options;

  const [silenceStage, setSilenceStage] = useState<'none' | 'gentle' | 'save-offer' | 'auto-saved'>('none');
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    hasDraft: false,
    lastSavedAt: null,
    draftId: null,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending');

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasSpokenGentleRef = useRef(false);
  const hasSpokenSaveOfferRef = useRef(false);
  const hasAutoSavedRef = useRef(false);
  const lastEmergencySaveAtRef = useRef(0);

  // Stable draft ID for the session — generated once, not on every save
  const draftIdRef = useRef<string>(`draft-${Date.now()}`);

  // Ref to track current messages without causing effect teardowns
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Save draft to localStorage via draftStorage (5-conversation rotation)
  const saveDraftToLocalStorage = useCallback(() => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length < 2) return;

    const draft = saveConversationDraft(currentMessages, draftIdRef.current, {
      onSyncStatusChange: setSyncStatus,
      onSyncError: (err) => console.warn('[AutoSave] Draft save issue:', err),
    });
    if (!draft) return;

    setAutoSaveState(prev => ({
      ...prev,
      hasDraft: true,
      lastSavedAt: new Date(),
      draftId: draft.id,
    }));
  }, []);

  // Save draft to Supabase (server-side persistence)
  const saveDraftToSupabase = useCallback(async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length < 2 || !enableSupabaseDrafts) return;

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      });
      if (response.ok) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
        console.warn('[AutoSave] Supabase draft save returned', response.status);
      }
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      console.warn('[AutoSave] Supabase draft save failed (protected locally):', err);
    }
  }, [enableSupabaseDrafts]);

  // Load draft from Supabase
  const loadDraftFromSupabase = useCallback(async (): Promise<{ messages: Message[]; savedAt: Date } | null> => {
    if (!enableSupabaseDrafts) return null;

    try {
      const response = await fetch('/api/drafts');
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.draft) return null;
      return { messages: data.draft.messages, savedAt: new Date(data.draft.updated_at) };
    } catch (err) {
      console.warn('[AutoSave] Could not load cloud draft (using local):', err);
      return null;
    }
  }, [enableSupabaseDrafts]);

  // Load draft from localStorage
  const loadDraft = useCallback((): { messages: Message[]; savedAt: Date } | null => {
    const result = loadConversationDraft();
    if (!result) return null;
    return {
      messages: result.draft.messages,
      savedAt: new Date(result.draft.savedAt),
    };
  }, []);

  // Clear draft from localStorage and optionally Supabase
  const clearDraft = useCallback(() => {
    const clearFromCloud = enableSupabaseDrafts
      ? async () => { await fetch('/api/drafts', { method: 'DELETE' }) }
      : undefined;

    clearConversationDraft(clearFromCloud);
    setAutoSaveState({ hasDraft: false, lastSavedAt: null, draftId: null });
  }, [enableSupabaseDrafts]);

  // Reset silence tracking (called when user speaks or interacts)
  const resetSilence = useCallback(() => {
    lastActivityRef.current = Date.now();
    silenceStartRef.current = null;
    setSilenceStage('none');
    setSilenceDuration(0);
    hasSpokenGentleRef.current = false;
    hasSpokenSaveOfferRef.current = false;
    // Note: We don't reset hasAutoSavedRef — once auto-saved, stay saved
  }, []);

  // Start tracking silence
  const startSilenceTracking = useCallback(() => {
    if (!enabled || messages.length < 2) return;

    silenceStartRef.current = Date.now();

    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);

    silenceTimerRef.current = setInterval(() => {
      if (!silenceStartRef.current) return;

      const elapsed = Date.now() - silenceStartRef.current;
      setSilenceDuration(elapsed);

      if (elapsed >= SILENCE_THRESHOLDS.AUTO_SAVE && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        setSilenceStage('auto-saved');
        const prompt = getRandomPrompt(SILENCE_PROMPTS.autoSaved);
        onPlayVoice(prompt);
        onSilencePrompt?.({ type: 'auto-saved', message: prompt });
        onAutoSave();
      } else if (elapsed >= SILENCE_THRESHOLDS.SAVE_OFFER && !hasSpokenSaveOfferRef.current) {
        hasSpokenSaveOfferRef.current = true;
        setSilenceStage('save-offer');
        const prompt = getRandomPrompt(SILENCE_PROMPTS.saveOffer);
        onPlayVoice(prompt);
        onSilencePrompt?.({ type: 'save-offer', message: prompt });
      } else if (elapsed >= SILENCE_THRESHOLDS.GENTLE_CHECKIN && !hasSpokenGentleRef.current) {
        hasSpokenGentleRef.current = true;
        setSilenceStage('gentle');
        const prompt = getRandomPrompt(SILENCE_PROMPTS.gentle);
        onPlayVoice(prompt);
        onSilencePrompt?.({ type: 'gentle', message: prompt });
      }
    }, 1000);
  }, [enabled, messages.length, onPlayVoice, onAutoSave, onSilencePrompt]);

  // Stop silence tracking
  const stopSilenceTracking = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceStartRef.current = null;
  }, []);

  // Save immediately to localStorage when messages change (fast path)
  useEffect(() => {
    if (!enabled || messages.length < 2) return;
    saveDraftToLocalStorage();
  }, [enabled, messages, saveDraftToLocalStorage]);

  // Emergency save on blur, visibility change, and beforeunload
  useEffect(() => {
    if (messages.length < 2) return;

    const emergencySave = () => {
      const now = Date.now();
      if (now - lastEmergencySaveAtRef.current < 750) return; // debounce
      lastEmergencySaveAtRef.current = now;
      saveDraftToLocalStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') emergencySave();
    };

    window.addEventListener('pagehide', emergencySave);
    window.addEventListener('beforeunload', emergencySave);
    window.addEventListener('blur', emergencySave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', emergencySave);
      window.removeEventListener('beforeunload', emergencySave);
      window.removeEventListener('blur', emergencySave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages.length, saveDraftToLocalStorage]);

  // 5-second local save — crash cushion, no network needed
  useEffect(() => {
    if (!enabled) return;

    draftTimerRef.current = setInterval(() => {
      if (messagesRef.current.length < 2) return;
      saveDraftToLocalStorage();
    }, LOCAL_SAVE_INTERVAL);

    return () => {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    };
  }, [enabled, saveDraftToLocalStorage]);

  // 30-second cloud sync — best-effort, separate from local save
  useEffect(() => {
    if (!enabled) return;

    cloudSyncTimerRef.current = setInterval(() => {
      if (messagesRef.current.length < 2) return;
      saveDraftToSupabase();
    }, CLOUD_SYNC_INTERVAL);

    return () => {
      if (cloudSyncTimerRef.current) clearInterval(cloudSyncTimerRef.current);
    };
  }, [enabled, saveDraftToSupabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSilenceTracking();
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
      if (cloudSyncTimerRef.current) clearInterval(cloudSyncTimerRef.current);
    };
  }, [stopSilenceTracking]);

  return {
    silenceStage,
    silenceDuration,
    autoSaveState,
    syncStatus,
    resetSilence,
    startSilenceTracking,
    stopSilenceTracking,
    saveDraftToLocalStorage,
    saveDraftToSupabase,
    loadDraft,
    loadDraftFromSupabase,
    clearDraft,
    detectVoiceCommand,
  };
}
