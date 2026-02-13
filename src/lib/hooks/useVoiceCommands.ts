'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

/**
 * Simple voice command recognition hook
 * Listens for specific trigger words and calls callbacks
 * Designed for elderly users who can't easily tap buttons
 */

interface VoiceCommandsOptions {
  onCommand?: (command: string, transcript: string) => void;
  onTranscript?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  commands?: string[]; // Specific words to listen for
  continuous?: boolean; // Keep listening after command
  stopOnCommand?: boolean; // Stop recognition when command detected (default true)
  enabled?: boolean;
}

// Common affirmative responses
const AFFIRMATIVE_WORDS = [
  'yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'alright',
  'start', 'begin', 'go', 'ready', 'continue', 'next',
  'let\'s go', 'i\'m ready', 'let\'s start', 'sounds good'
];

// Common negative responses
const NEGATIVE_WORDS = [
  'no', 'nope', 'not yet', 'wait', 'stop', 'cancel', 'skip', 'back'
];

export function useVoiceCommands(options: VoiceCommandsOptions = {}) {
  const {
    onCommand,
    onTranscript,
    onListeningChange,
    commands = [],
    continuous = false,
    stopOnCommand = true,
    enabled = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Detect if transcript contains an affirmative response
  const isAffirmative = useCallback((text: string): boolean => {
    const lower = text.toLowerCase().trim();
    return AFFIRMATIVE_WORDS.some(word => lower.includes(word));
  }, []);

  // Detect if transcript contains a negative response
  const isNegative = useCallback((text: string): boolean => {
    const lower = text.toLowerCase().trim();
    return NEGATIVE_WORDS.some(word => lower.includes(word));
  }, []);

  // Detect custom commands
  const detectCommand = useCallback((text: string): string | null => {
    const lower = text.toLowerCase().trim();

    // Check custom commands first
    for (const cmd of commands) {
      if (lower.includes(cmd.toLowerCase())) {
        return cmd;
      }
    }

    // Check for affirmative/negative
    if (isAffirmative(lower)) return 'yes';
    if (isNegative(lower)) return 'no';

    return null;
  }, [commands, isAffirmative, isNegative]);

  // Parse spelled name (e.g., "H-A-R-O-L-D" or "H A R O L D")
  const parseSpelledName = useCallback((text: string): string | null => {
    // Check if it looks like spelling (single letters with separators)
    const spellingPattern = /^[a-z](\s*[-.,\s]\s*[a-z])+$/i;
    const cleaned = text.trim();

    if (spellingPattern.test(cleaned)) {
      // Extract just the letters
      const letters = cleaned.match(/[a-z]/gi);
      if (letters && letters.length >= 2) {
        // Capitalize first letter, lowercase rest
        const name = letters.join('');
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }

    return null;
  }, []);

  // Parse spoken name (capitalize first letter)
  const parseSpokenName = useCallback((text: string): string => {
    // First check if they're spelling it
    const spelled = parseSpelledName(text);
    if (spelled) return spelled;

    // Otherwise treat as spoken name
    // Handle "my name is X" or "call me X" patterns
    const patterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /i am (\w+)/i,
      /call me (\w+)/i,
      /it's (\w+)/i,
      /^(\w+)$/i, // Just the name
    ];

    for (const pattern of patterns) {
      const match = text.trim().match(pattern);
      if (match && match[1]) {
        const name = match[1];
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }

    // Fallback: take first word and capitalize
    const firstWord = text.trim().split(/\s+/)[0];
    if (firstWord && firstWord.length >= 2) {
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }

    return text.trim();
  }, [parseSpelledName]);

  // Parse spoken interests from a sentence
  const parseInterests = useCallback((text: string, availableInterests: string[]): string[] => {
    const lower = text.toLowerCase();
    const found: string[] = [];

    for (const interest of availableInterests) {
      if (lower.includes(interest.toLowerCase())) {
        found.push(interest);
      }
    }

    return found;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !enabled || isListeningRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      onListeningChange?.(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      onTranscript?.(currentTranscript);

      // Check for commands in final transcript
      if (finalTranscript) {
        const command = detectCommand(finalTranscript);
        if (command) {
          onCommand?.(command, finalTranscript);
          if (stopOnCommand && !continuous) {
            recognition.stop();
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Voice recognition error: ${event.error}`);
      }
      isListeningRef.current = false;
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      onListeningChange?.(false);

      // Auto-restart if continuous mode
      if (continuous && enabled) {
        setTimeout(() => {
          if (enabled && !isListeningRef.current) {
            startListening();
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, enabled, continuous, stopOnCommand, detectCommand, onCommand, onTranscript, onListeningChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    // Utilities
    isAffirmative,
    isNegative,
    detectCommand,
    parseSpokenName,
    parseSpelledName,
    parseInterests,
  };
}
