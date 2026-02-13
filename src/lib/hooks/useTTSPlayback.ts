'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * TTS Playback Hook
 *
 * Manages all text-to-speech audio playback state.
 * Extracted from conversation/page.tsx to make TTS logic
 * independently testable and reusable.
 *
 * Owns: isSpeaking, isLoadingTTS, audio elements, speak guard ref
 * Provides: playText(), stopAllAudio()
 */

// Warm, empathetic loading messages that rotate randomly
const WARM_LOADING_MESSAGES = [
  "Embers is listening...",
  "Taking it all in...",
  "Gathering my thoughts...",
  "Reflecting on what you shared...",
  "Just a moment...",
  "Holding space for you...",
  "With you shortly...",
  "Savoring your words...",
];

interface PlayTextOptions {
  /** Called when audio finishes playing successfully */
  onEnd?: () => void;
  /** Called when audio fails to play (TTS fetch or playback error) */
  onError?: () => void;
}

export interface UseTTSPlaybackReturn {
  /** Whether Embers is currently speaking */
  isSpeaking: boolean;
  /** Ref-based guard — doesn't go stale in closures */
  isSpeakingRef: React.MutableRefObject<boolean>;
  /** Whether TTS audio is being fetched (before playback starts) */
  isLoadingTTS: boolean;
  /** Warm loading message shown while fetching TTS */
  warmLoadingMessage: string;
  /** Play text through TTS. Resolves when audio finishes or fails. */
  playText: (text: string, options?: PlayTextOptions) => Promise<void>;
  /** Stop all audio immediately */
  stopAllAudio: () => void;
}

export function useTTSPlayback(): UseTTSPlaybackReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [warmLoadingMessage, setWarmLoadingMessage] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  const playText = useCallback(async (text: string, options?: PlayTextOptions) => {
    try {
      setIsLoadingTTS(true);
      setWarmLoadingMessage(
        WARM_LOADING_MESSAGES[Math.floor(Math.random() * WARM_LOADING_MESSAGES.length)]
      );

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any existing audio before playing new
      stopAllAudio();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      audio.onended = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        options?.onEnd?.();
      };

      audio.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsLoadingTTS(false);
        setWarmLoadingMessage('');
        URL.revokeObjectURL(audioUrl);
        options?.onError?.();
      };

      await audio.play();
    } catch {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      options?.onError?.();
    }
  }, [stopAllAudio]);

  return {
    isSpeaking,
    isSpeakingRef,
    isLoadingTTS,
    warmLoadingMessage,
    playText,
    stopAllAudio,
  };
}
