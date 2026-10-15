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
  // In-session cache: same line spoken twice reuses audio, no second API call. Max 20, oldest evicted.
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    // Stop browser-voice fallback too, if it's speaking.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Browser voice fallback (Road-Lore / Loomiverse pattern): if /api/tts fails, dad still hears something.
  // Uses built-in device voice, warm + slightly slow. No API cost, no key needed.
  const speakWithBrowser = useCallback((text: string, options?: PlayTextOptions): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        options?.onError?.();
        resolve();
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voices = synth.getVoices();
      const pick = voices.find((v) => v.name.includes('Samantha')) || voices.find((v) => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female')) || voices.find((v) => v.lang.startsWith('en-US')) || voices[0];
      if (pick) utterance.voice = pick;
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        options?.onEnd?.();
        resolve();
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        options?.onError?.();
        resolve();
      };
      synth.speak(utterance);
    });
  }, []);

  const playText = useCallback(async (text: string, options?: PlayTextOptions) => {
    // Cache hit: same line spoken before in this session — play instantly, no API call.
    const cachedUrl = audioCacheRef.current.get(text);
    if (cachedUrl) {
      stopAllAudio();
      const cachedAudio = new Audio(cachedUrl);
      audioRef.current = cachedAudio;
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      cachedAudio.onended = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      cachedAudio.onerror = async () => {
        audioCacheRef.current.delete(text);
        await speakWithBrowser(text, options);
      };
      try {
        await cachedAudio.play();
        return;
      } catch {
        await speakWithBrowser(text, options);
        return;
      }
    }

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

      // Cache it (max 20, evict oldest). Don't revoke cached URLs on end — they're reused.
      audioCacheRef.current.set(text, audioUrl);
      if (audioCacheRef.current.size > 20) {
        const oldestKey = audioCacheRef.current.keys().next().value;
        if (oldestKey !== undefined) {
          const oldestUrl = audioCacheRef.current.get(oldestKey);
          if (oldestUrl) URL.revokeObjectURL(oldestUrl);
          audioCacheRef.current.delete(oldestKey);
        }
      }

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
        options?.onEnd?.();
      };

      audio.onerror = async () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsLoadingTTS(false);
        setWarmLoadingMessage('');
        await speakWithBrowser(text, options);
      };

      await audio.play();
    } catch (err) {
      console.warn('[TTS] API playback failed, trying browser voice:', err);
      setIsLoadingTTS(false);
      setWarmLoadingMessage('');
      await speakWithBrowser(text, options);
    }
  }, [stopAllAudio, speakWithBrowser]);

  return {
    isSpeaking,
    isSpeakingRef,
    isLoadingTTS,
    warmLoadingMessage,
    playText,
    stopAllAudio,
  };
}
