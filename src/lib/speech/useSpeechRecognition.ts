'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Silence stages matching iOS app behavior
export type SilenceStage = 'none' | 'detected' | 'preparing' | 'readyToSend';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onSilence?: () => void;
  onSilenceStageChange?: (stage: SilenceStage, duration: number) => void;
  silenceTimeout?: number; // ms to wait before triggering silence (auto-send)
  continuous?: boolean;
}

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  silenceStage: SilenceStage;
  silenceDuration: number; // 0 to 1 progress
  silenceMessage: string;
}

// Silence thresholds in milliseconds (matching iOS)
const SILENCE_THRESHOLDS = {
  detected: 2000,    // 2 seconds - "I'm listening..."
  preparing: 3000,   // 3 seconds - "Sending soon..."
  readyToSend: 5000, // 5 seconds - auto-send
};

function getSilenceStage(duration: number): SilenceStage {
  if (duration >= SILENCE_THRESHOLDS.readyToSend) return 'readyToSend';
  if (duration >= SILENCE_THRESHOLDS.preparing) return 'preparing';
  if (duration >= SILENCE_THRESHOLDS.detected) return 'detected';
  return 'none';
}

function getSilenceMessage(stage: SilenceStage): string {
  switch (stage) {
    case 'detected':
      return "I'm listening...";
    case 'preparing':
      return 'Sending soon...';
    case 'readyToSend':
      return 'Sending message';
    default:
      return '';
  }
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onResult,
    onSilence,
    onSilenceStageChange,
    silenceTimeout = 5000,
    continuous = true,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
    silenceStage: 'none',
    silenceDuration: 0,
    silenceMessage: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const lastStageRef = useRef<SilenceStage>('none');

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    setState((prev) => ({ ...prev, isSupported: !!SpeechRecognition }));
  }, []);

  const clearSilenceTracking = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    silenceStartRef.current = null;
    lastStageRef.current = 'none';
    setState((prev) => ({
      ...prev,
      silenceStage: 'none',
      silenceDuration: 0,
      silenceMessage: '',
    }));
  }, []);

  const startSilenceTracking = useCallback(() => {
    clearSilenceTracking();
    silenceStartRef.current = Date.now();

    // Update silence progress every 100ms (matching iOS)
    silenceIntervalRef.current = setInterval(() => {
      if (!silenceStartRef.current) return;

      const elapsed = Date.now() - silenceStartRef.current;
      const progress = Math.min(elapsed / silenceTimeout, 1);
      const stage = getSilenceStage(elapsed);
      const message = getSilenceMessage(stage);

      setState((prev) => ({
        ...prev,
        silenceStage: stage,
        silenceDuration: progress,
        silenceMessage: message,
      }));

      // Notify on stage change
      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
        if (onSilenceStageChange) {
          onSilenceStageChange(stage, elapsed);
        }
      }
    }, 100);

    // Auto-send after silence timeout
    silenceTimerRef.current = setTimeout(() => {
      if (finalTranscriptRef.current && onSilence) {
        onSilence();
      }
    }, silenceTimeout);
  }, [clearSilenceTracking, silenceTimeout, onSilence, onSilenceStageChange]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
      }));
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: '',
        interimTranscript: '',
        silenceStage: 'none',
        silenceDuration: 0,
        silenceMessage: '',
      }));
      finalTranscriptRef.current = '';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        setState((prev) => ({
          ...prev,
          transcript: finalTranscriptRef.current,
          interimTranscript: '',
        }));

        if (onResult) {
          onResult(finalTranscriptRef.current);
        }

        // Reset silence timer on new speech
        startSilenceTracking();
      } else {
        setState((prev) => ({
          ...prev,
          interimTranscript,
        }));
        // User is speaking, reset silence timer
        startSilenceTracking();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      let errorMessage = 'An error occurred with speech recognition.';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'A network error occurred. Please check your connection.';
          break;
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isListening: false,
      }));
      clearSilenceTracking();
    };

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isListening: false,
      }));
      clearSilenceTracking();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startSilenceTracking();
  }, [continuous, onResult, startSilenceTracking, clearSilenceTracking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearSilenceTracking();
    setState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, [clearSilenceTracking]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearSilenceTracking();
    };
  }, [clearSilenceTracking]);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
