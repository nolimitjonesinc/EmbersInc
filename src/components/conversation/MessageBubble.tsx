'use client';

import { cn } from '@/lib/utils/cn';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: () => void;
}

export function MessageBubble({ message, onPlayAudio }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4',
          'transition-all duration-200',
          isUser
            ? 'bg-ember-gradient text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
        )}
      >
        {/* Speaker label for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium text-ember-orange">Ember</span>
          </div>
        )}

        {/* Message content */}
        <p className="text-lg leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Play button for assistant messages */}
        {!isUser && onPlayAudio && (
          <button
            onClick={onPlayAudio}
            className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-ember-orange transition-colors"
            aria-label="Play this message"
          >
            <span>🔊</span>
            <span>Listen</span>
          </button>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'text-xs mt-2',
            isUser ? 'text-white/70' : 'text-gray-400'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
