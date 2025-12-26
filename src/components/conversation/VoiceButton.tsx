'use client';

import { cn } from '@/lib/utils/cn';

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isListening,
  isProcessing,
  isSpeaking,
  onClick,
  disabled,
}: VoiceButtonProps) {
  const getButtonState = () => {
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  const state = getButtonState();

  const getButtonLabel = () => {
    switch (state) {
      case 'speaking':
        return 'Ember is speaking...';
      case 'processing':
        return 'Thinking...';
      case 'listening':
        return 'Listening... (tap to stop)';
      default:
        return 'Tap to Talk';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={onClick}
        disabled={disabled || isSpeaking || isProcessing}
        className={cn(
          'relative w-32 h-32 md:w-40 md:h-40 rounded-full transition-all duration-300',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-4 focus:ring-ember-orange/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          state === 'idle' &&
            'bg-ember-gradient shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
          state === 'listening' &&
            'bg-ember-gradient shadow-xl scale-110 animate-pulse-ember',
          state === 'processing' && 'bg-gray-200 cursor-wait',
          state === 'speaking' && 'bg-blue-500 cursor-default'
        )}
        aria-label={getButtonLabel()}
      >
        {/* Ripple effect when listening */}
        {state === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-ember-orange/20 animate-ping" />
            <span
              className="absolute inset-0 rounded-full bg-ember-orange/10 animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 text-5xl md:text-6xl">
          {state === 'idle' && '🎙️'}
          {state === 'listening' && '🔴'}
          {state === 'processing' && '⏳'}
          {state === 'speaking' && '🔊'}
        </span>
      </button>

      {/* Status label */}
      <p
        className={cn(
          'text-xl font-medium transition-colors',
          state === 'idle' && 'text-gray-600',
          state === 'listening' && 'text-ember-orange',
          state === 'processing' && 'text-gray-500',
          state === 'speaking' && 'text-blue-600'
        )}
      >
        {getButtonLabel()}
      </p>

      {/* Voice visualization bars when listening */}
      {state === 'listening' && (
        <div className="flex items-end gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-ember-orange rounded-full voice-bar"
              style={{
                height: '100%',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
