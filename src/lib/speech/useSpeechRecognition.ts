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
  autoRestart?: boolean; // Auto-restart if recognition stops unexpectedly
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
  recordingDuration: number; // Total recording time in seconds
}

// Silence thresholds in milliseconds
// Generous for elderly users — they pause to think, collect memories, find words.
const SILENCE_THRESHOLDS = {
  detected: 4000,     // 4 seconds - "Take your time..."
  preparing: 6000,    // 6 seconds - "Whenever you're ready..."
  readyToSend: 8000,  // 8 seconds - auto-send
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
      return "Take your time... I'm here.";
    case 'preparing':
      return 'Whenever you\'re ready...';
    case 'readyToSend':
      return 'Sending your thoughts';
    default:
      return '';
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onResult,
    onSilence,
    onSilenceStageChange,
    silenceTimeout = 8000,
    continuous = true,
    autoRestart = true, // Enable auto-restart by default for reliability
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
    recordingDuration: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const lastStageRef = useRef<SilenceStage>('none');

  // Auto-restart refs
  const wantListeningRef = useRef(false); // Tracks if user wants to be listening
  const restartCountRef = useRef(0); // Track restarts to prevent infinite loops
  const lastRestartTimeRef = useRef(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    setState((prev) => ({ ...prev, isSupported: !!SpeechRecognition }));
  }, []);

  const clearDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    clearDurationTimer();
    if (!recordingStartTimeRef.current) {
      recordingStartTimeRef.current = Date.now();
    }
    durationIntervalRef.current = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, recordingDuration: elapsed }));
      }
    }, 1000);
  }, [clearDurationTimer]);

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

  const createRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    // Increase max alternatives for better accuracy
    recognition.maxAlternatives = 1;

    return recognition;
  }, [continuous]);

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

    // Mark that we want to be listening
    wantListeningRef.current = true;
    restartCountRef.current = 0;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        interimTranscript: '',
        silenceStage: 'none',
        silenceDuration: 0,
        silenceMessage: '',
      }));
      // Only reset transcript on first start, not on restarts
      if (restartCountRef.current === 0) {
        finalTranscriptRef.current = '';
        setState((prev) => ({ ...prev, transcript: '', recordingDuration: 0 }));
        recordingStartTimeRef.current = null;
      }
      startDurationTimer();
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
        // Add space between segments if needed
        if (finalTranscriptRef.current && !finalTranscriptRef.current.endsWith(' ')) {
          finalTranscriptRef.current += ' ';
        }
        finalTranscriptRef.current += finalTranscript;
        setState((prev) => ({
          ...prev,
          transcript: finalTranscriptRef.current,
          interimTranscript: '',
        }));

        if (onResult) {
          onResult(finalTranscriptRef.current);
        }

        // Only start/reset silence timer on FINAL results.
        // This is when the user has finished a phrase — now we wait for more.
        startSilenceTracking();
      } else {
        setState((prev) => ({
          ...prev,
          interimTranscript,
        }));
        // Interim results = user is mid-speech. Clear any active silence
        // timer (they're still talking) but don't START a new one.
        // The timer only starts after a final result lands.
        if (silenceStartRef.current) {
          clearSilenceTracking();
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          // No speech detected - this is normal, just restart if we want to keep listening
          if (autoRestart && wantListeningRef.current) {
            // Don't show error, just restart silently
            setTimeout(() => {
              if (wantListeningRef.current) {
                restartCountRef.current++;
                recognition.start();
              }
            }, 100);
            return;
          }
          break;
        case 'aborted':
          // Recognition was aborted - restart if we want to keep listening
          if (autoRestart && wantListeningRef.current) {
            setTimeout(() => {
              if (wantListeningRef.current) {
                restartCountRef.current++;
                try {
                  recognition.start();
                } catch {
                  // If start fails, create new recognition
                  const newRecognition = createRecognition();
                  if (newRecognition) {
                    recognitionRef.current = newRecognition;
                    startListening();
                  }
                }
              }
            }, 100);
            return;
          }
          break;
        case 'audio-capture':
          setState((prev) => ({
            ...prev,
            error: 'No microphone found. Please check your microphone.',
          }));
          wantListeningRef.current = false;
          break;
        case 'not-allowed':
          setState((prev) => ({
            ...prev,
            error: 'Microphone permission denied. Please allow microphone access.',
          }));
          wantListeningRef.current = false;
          break;
        case 'network':
          // Network error - try to restart
          if (autoRestart && wantListeningRef.current && restartCountRef.current < 5) {
            setTimeout(() => {
              if (wantListeningRef.current) {
                restartCountRef.current++;
                try {
                  recognition.start();
                } catch {
                  // Ignore
                }
              }
            }, 500);
            return;
          }
          setState((prev) => ({
            ...prev,
            error: 'Network error. Please check your connection.',
          }));
          break;
        default:
          // Unknown error
          if (autoRestart && wantListeningRef.current && restartCountRef.current < 3) {
            setTimeout(() => {
              if (wantListeningRef.current) {
                restartCountRef.current++;
                try {
                  recognition.start();
                } catch {
                  // Ignore
                }
              }
            }, 200);
            return;
          }
      }

      setState((prev) => ({
        ...prev,
        isListening: false,
      }));
      clearSilenceTracking();
      clearDurationTimer();
    };

    recognition.onend = () => {
      // Auto-restart if we want to keep listening and haven't hit restart limit
      const now = Date.now();
      const timeSinceLastRestart = now - lastRestartTimeRef.current;

      if (autoRestart && wantListeningRef.current) {
        // Prevent rapid restarts (max 10 restarts in 10 seconds)
        if (restartCountRef.current < 10 || timeSinceLastRestart > 10000) {
          if (timeSinceLastRestart > 10000) {
            restartCountRef.current = 0; // Reset counter after 10 seconds
          }

          lastRestartTimeRef.current = now;
          restartCountRef.current++;

          // Restart recognition
          setTimeout(() => {
            if (wantListeningRef.current) {
              try {
                recognition.start();
              } catch {
                // If start fails, create new recognition instance
                const newRecognition = createRecognition();
                if (newRecognition) {
                  recognitionRef.current = newRecognition;
                  // Re-setup event handlers by calling startListening again
                  // But preserve transcript
                  const savedTranscript = finalTranscriptRef.current;
                  startListening();
                  finalTranscriptRef.current = savedTranscript;
                }
              }
            }
          }, 50);
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        isListening: false,
      }));
      clearSilenceTracking();
      clearDurationTimer();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      // Don't start silence tracking here — wait until the user actually speaks.
      // Starting it at recognition.start() would show "Take your time..." stages
      // to elderly users who are just getting ready to talk.
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setState((prev) => ({
        ...prev,
        error: 'Failed to start speech recognition. Please try again.',
      }));
    }
  }, [continuous, onResult, startSilenceTracking, clearSilenceTracking, autoRestart, createRecognition, startDurationTimer, clearDurationTimer]);

  const stopListening = useCallback(() => {
    // Mark that we don't want to be listening anymore
    wantListeningRef.current = false;
    restartCountRef.current = 0;
    recordingStartTimeRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }
    clearSilenceTracking();
    clearDurationTimer();
    setState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, [clearSilenceTracking, clearDurationTimer]);

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
      wantListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      clearSilenceTracking();
      clearDurationTimer();
    };
  }, [clearSilenceTracking, clearDurationTimer]);

  return {
    ...state,
    formattedDuration: formatDuration(state.recordingDuration),
    startListening,
    stopListening,
    resetTranscript,
  };
}
