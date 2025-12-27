'use client';

import { useEffect, useState } from 'react';

interface AmbientFireProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  showEmberCount?: number;
}

export function AmbientFire({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  onClick,
  size = 'large',
  showEmberCount = 0,
}: AmbientFireProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sizeClasses = {
    small: 'w-24 h-32',
    medium: 'w-40 h-52',
    large: 'w-56 h-72',
  };

  const emberSizes = {
    small: 'w-8 h-8',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  // Intensity based on state
  const intensity = isListening ? 1.3 : isSpeaking ? 0.85 : isProcessing ? 0.7 : 1;

  return (
    <div
      className={`relative ${sizeClasses[size]} cursor-pointer group`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={isListening ? 'Listening... tap to stop' : 'Tap to start speaking'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Ambient glow - the warm light that fills the space */}
      <div
        className="absolute inset-0 rounded-full blur-3xl transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at center bottom,
            rgba(255, 140, 50, ${0.4 * intensity}) 0%,
            rgba(232, 109, 72, ${0.2 * intensity}) 40%,
            transparent 70%)`,
          transform: `scale(${1.5 + (isListening ? 0.3 : 0)})`,
        }}
      />

      {/* Secondary glow layer */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center 70%,
            rgba(255, 180, 100, ${0.3 * intensity}) 0%,
            rgba(255, 120, 50, ${0.15 * intensity}) 50%,
            transparent 70%)`,
          animation: 'breathe 4s ease-in-out infinite',
        }}
      />

      {/* The core ember - soft, glowing, alive */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div
          className={`${emberSizes[size]} rounded-full relative transition-all duration-500`}
          style={{
            background: `radial-gradient(ellipse at 30% 30%,
              rgba(255, 220, 180, ${0.95 * intensity}) 0%,
              rgba(255, 160, 80, ${0.9 * intensity}) 20%,
              rgba(232, 109, 72, ${0.85 * intensity}) 40%,
              rgba(196, 90, 58, ${0.7 * intensity}) 60%,
              rgba(120, 50, 30, ${0.4 * intensity}) 80%,
              transparent 100%)`,
            boxShadow: `
              0 0 ${20 * intensity}px ${10 * intensity}px rgba(255, 150, 80, ${0.5 * intensity}),
              0 0 ${40 * intensity}px ${20 * intensity}px rgba(232, 109, 72, ${0.3 * intensity}),
              0 0 ${80 * intensity}px ${40 * intensity}px rgba(196, 90, 58, ${0.15 * intensity}),
              inset 0 0 ${15 * intensity}px rgba(255, 200, 150, ${0.3 * intensity})
            `,
            animation: isListening
              ? 'ember-pulse-active 1.5s ease-in-out infinite'
              : 'ember-pulse 4s ease-in-out infinite',
            transform: `scale(${isListening ? 1.15 : 1})`,
          }}
        >
          {/* Inner hot core */}
          <div
            className="absolute top-1/4 left-1/4 w-1/3 h-1/3 rounded-full"
            style={{
              background: `radial-gradient(circle,
                rgba(255, 250, 230, ${0.8 * intensity}) 0%,
                rgba(255, 200, 120, ${0.4 * intensity}) 50%,
                transparent 100%)`,
              filter: `blur(${2 * intensity}px)`,
              animation: 'flicker 2s ease-in-out infinite alternate',
            }}
          />
        </div>

        {/* Floating ember particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + Math.random() * 4,
              height: 3 + Math.random() * 4,
              left: `${40 + (i - 3) * 12}%`,
              bottom: '100%',
              background: `radial-gradient(circle,
                rgba(255, 200, 100, 0.9) 0%,
                rgba(255, 150, 80, 0.6) 50%,
                transparent 100%)`,
              boxShadow: '0 0 6px 2px rgba(255, 150, 80, 0.4)',
              animation: `float-up ${3 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 0.7}s`,
              opacity: intensity,
            }}
          />
        ))}
      </div>

      {/* Story embers - small glowing dots representing saved stories */}
      {showEmberCount > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(Math.min(showEmberCount, 7))].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 180, 100, 0.9), rgba(232, 109, 72, 0.6))',
                boxShadow: '0 0 8px 2px rgba(255, 150, 80, 0.5)',
                animation: `ember-glow 3s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tap hint */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[#f9f7f2]/30 text-sm font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            tap to begin
          </p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }

        @keyframes ember-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        @keyframes ember-pulse-active {
          0%, 100% { transform: scale(1.15); }
          50% { transform: scale(1.22); }
        }

        @keyframes flicker {
          0% { opacity: 0.7; transform: scale(1) translate(0, 0); }
          25% { opacity: 0.9; transform: scale(1.1) translate(1px, -1px); }
          50% { opacity: 0.75; transform: scale(0.95) translate(-1px, 1px); }
          75% { opacity: 0.85; transform: scale(1.05) translate(1px, 0); }
          100% { opacity: 0.8; transform: scale(1) translate(0, -1px); }
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-120px) translateX(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random() * 20}px);
            opacity: 0;
          }
        }

        @keyframes ember-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
