'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onSilence?: () => void;
  silenceTimeout?: number; // ms to wait before triggering silence
  continuous?: boolean;
}

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onResult,
    onSilence,
    silenceTimeout = 5000,
    continuous = true,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    setState((prev) => ({ ...prev, isSupported: !!SpeechRecognition }));
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (finalTranscriptRef.current && onSilence) {
        onSilence();
      }
    }, silenceTimeout);
  }, [clearSilenceTimer, silenceTimeout, onSilence]);

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
        startSilenceTimer();
      } else {
        setState((prev) => ({
          ...prev,
          interimTranscript,
        }));
        // User is speaking, reset silence timer
        startSilenceTimer();
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
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isListening: false,
      }));
      clearSilenceTimer();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startSilenceTimer();
  }, [continuous, onResult, startSilenceTimer, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearSilenceTimer();
    setState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, [clearSilenceTimer]);

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
      clearSilenceTimer();
    };
  }, [clearSilenceTimer]);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}

