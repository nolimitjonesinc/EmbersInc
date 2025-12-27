'use client';

import { cn } from '@/lib/utils/cn';

interface BreathingEmberProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isWaiting?: boolean;
  onClick: () => void;
  disabled?: boolean;
  stageColor?: string; // Color to override based on silence stage
}

export function BreathingEmber({
  isListening,
  isProcessing,
  isSpeaking,
  isWaiting = false,
  onClick,
  disabled,
  stageColor,
}: BreathingEmberProps) {
  const getState = () => {
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isWaiting) return 'waiting';
    if (isListening) return 'listening';
    return 'idle';
  };

  const state = getState();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Ember container */}
      <button
        onClick={onClick}
        disabled={disabled || isSpeaking || isProcessing}
        className={cn(
          'relative w-36 h-36 md:w-44 md:h-44 cursor-pointer',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-transform duration-300',
          state === 'idle' && 'hover:scale-105',
          state === 'listening' && 'scale-110'
        )}
        aria-label={
          state === 'idle'
            ? 'Tap to start speaking'
            : state === 'listening'
            ? 'Listening... tap to stop'
            : state === 'processing'
            ? 'Thinking...'
            : state === 'speaking'
            ? 'Ember is speaking'
            : 'Take your time...'
        }
      >
        {/* Outer expanding ring */}
        <span
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'rounded-full border border-ember-orange/10',
            state === 'listening' && 'animate-ember-ring-outer',
            state !== 'listening' && 'opacity-0'
          )}
          style={{ width: 90, height: 90 }}
        />

        {/* Inner expanding ring */}
        <span
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'rounded-full border border-ember-orange/20',
            state === 'listening' && 'animate-ember-ring',
            state !== 'listening' && 'opacity-0'
          )}
          style={{ width: 90, height: 90 }}
        />

        {/* The ember core */}
        <span
          className={cn(
            'absolute top-1/2 left-1/2',
            'w-9 h-9 rounded-full',
            'transition-all duration-300',
            state === 'idle' && 'animate-ember-breathe',
            state === 'listening' && 'animate-ember-breathe scale-110',
            state === 'waiting' && 'animate-gentle-pulse',
            state === 'processing' && 'opacity-50',
            state === 'speaking' && 'animate-ember-breathe'
          )}
          style={{
            background: stageColor
              ? `radial-gradient(circle at 30% 30%, ${stageColor}80, ${stageColor})`
              : 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
            boxShadow: stageColor
              ? `0 0 40px 15px ${stageColor}80, 0 0 80px 30px ${stageColor}40`
              : '0 0 40px 15px rgba(232, 109, 72, 0.5), 0 0 80px 30px rgba(232, 109, 72, 0.2)',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Recording hint - shows on hover when idle */}
        {state === 'idle' && (
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-text-whisper uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
            Tap to speak
          </span>
        )}
      </button>

      {/* Status label - subtle, not shouty */}
      <p
        className={cn(
          'text-lg font-serif transition-all duration-500',
          state === 'idle' && 'text-text-soft opacity-0',
          state === 'listening' && 'text-text-warm animate-fade-up',
          state === 'waiting' && 'text-text-soft animate-fade-up',
          state === 'processing' && 'text-text-whisper',
          state === 'speaking' && 'text-text-soft'
        )}
      >
        {state === 'listening' && "I'm listening..."}
        {state === 'waiting' && 'Take your time...'}
        {state === 'processing' && 'Thinking...'}
        {state === 'speaking' && 'Speaking...'}
      </p>
    </div>
  );
}
