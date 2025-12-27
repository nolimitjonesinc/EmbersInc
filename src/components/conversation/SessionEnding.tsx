'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SessionEndingProps {
  userName: string;
  storyId?: string;
  onNewStory: () => void;
}

export function SessionEnding({ userName, storyId, onNewStory }: SessionEndingProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Stagger the animations
    const messageTimer = setTimeout(() => setShowMessage(true), 500);
    const buttonTimer = setTimeout(() => setShowButtons(true), 2000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="min-h-screen recording-environment flex flex-col items-center justify-center p-6 relative">
      {/* Grain overlay */}
      <div className="recording-grain" />
      {/* Vignette */}
      <div className="recording-vignette" />

      <div className="relative z-10 text-center max-w-md space-y-12">
        {/* The ember - smaller, settled */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <span
            className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full animate-gentle-pulse"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
              boxShadow: `
                0 0 30px 10px rgba(232, 109, 72, 0.4),
                0 0 60px 20px rgba(232, 109, 72, 0.15)
              `,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Completion message */}
        <div
          className={`space-y-4 transition-all duration-1000 ${
            showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="completion-message">
            Thank you for sharing this with me{userName ? `, ${userName}` : ''}.
          </p>
          <p className="completion-message opacity-80">
            This memory is now part of your family&apos;s story.
          </p>
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {storyId && (
            <Link
              href="/stories"
              className="recording-btn-finish inline-flex items-center justify-center gap-2"
            >
              View Your Stories
            </Link>
          )}
          <button
            onClick={onNewStory}
            className="recording-btn-finish inline-flex items-center justify-center gap-2 hover:bg-ember-orange/10"
          >
            Share Another Memory
          </button>
        </div>

        {/* Subtle home link */}
        <Link
          href="/"
          className={`text-text-whisper hover:text-text-soft text-sm transition-all duration-500 block ${
            showButtons ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
