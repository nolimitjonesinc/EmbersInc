'use client';

import { useEffect, useState, useRef } from 'react';

interface FlameButtonProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  showEmberCount?: number;
}

interface Ember {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

export function FlameButton({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  onClick,
  size = 'large',
  showEmberCount = 0,
}: FlameButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [embers, setEmbers] = useState<Ember[]>([]);
  const emberIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random embers continuously
  useEffect(() => {
    if (!mounted) return;

    const spawnEmber = () => {
      const newEmber: Ember = {
        id: emberIdRef.current++,
        x: 30 + Math.random() * 40, // Random x position (30-70% of container)
        y: 50 + Math.random() * 20, // Start from middle-bottom of flame
        size: 2 + Math.random() * 4,
        duration: 3 + Math.random() * 3, // 3-6 seconds
        delay: 0,
        drift: -30 + Math.random() * 60, // Random horizontal drift
        opacity: 0.5 + Math.random() * 0.5,
      };

      setEmbers(prev => [...prev.slice(-15), newEmber]); // Keep max 15 embers
    };

    // Spawn embers at random intervals
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to spawn
        spawnEmber();
      }
    }, 400);

    // Initial embers
    for (let i = 0; i < 6; i++) {
      setTimeout(() => spawnEmber(), i * 200);
    }

    return () => clearInterval(spawnInterval);
  }, [mounted]);

  if (!mounted) return null;

  const sizeConfig = {
    small: { scale: 0.5, width: 160, height: 220 },
    medium: { scale: 0.75, width: 220, height: 300 },
    large: { scale: 1, width: 300, height: 400 },
  };

  const config = sizeConfig[size];
  const intensity = isListening ? 1.25 : isSpeaking ? 0.85 : isProcessing ? 0.6 : 1;

  return (
    <div
      className="relative cursor-pointer group"
      style={{ width: config.width, height: config.height }}
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
      {/* Deep background warmth */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 65%,
            rgba(180, 80, 30, ${0.2 * intensity}) 0%,
            rgba(120, 50, 20, ${0.1 * intensity}) 40%,
            transparent 70%)`,
          filter: 'blur(60px)',
          transform: `scale(${1.4 + (isListening ? 0.2 : 0)})`,
        }}
      />

      {/* Primary ambient glow */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 60%,
            rgba(255, 130, 50, ${0.35 * intensity}) 0%,
            rgba(230, 90, 40, ${0.2 * intensity}) 30%,
            rgba(180, 60, 30, ${0.1 * intensity}) 50%,
            transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'ambientPulse 5s ease-in-out infinite',
        }}
      />

      {/* Secondary breathing glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 45% at 50% 58%,
            rgba(255, 160, 80, ${0.3 * intensity}) 0%,
            rgba(255, 120, 60, ${0.15 * intensity}) 40%,
            transparent 60%)`,
          filter: 'blur(25px)',
          animation: 'breatheGlow 4s ease-in-out infinite 0.5s',
        }}
      />

      {/* Flame container */}
      <div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2"
        style={{
          width: 120 * config.scale,
          height: 240 * config.scale,
        }}
      >
        {/* Base glow at flame bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 100 * config.scale * intensity,
            height: 40 * config.scale * intensity,
            background: `radial-gradient(ellipse at center,
              rgba(255, 200, 100, ${0.8 * intensity}) 0%,
              rgba(255, 150, 80, ${0.4 * intensity}) 40%,
              transparent 70%)`,
            filter: 'blur(12px)',
          }}
        />

        {/* Outer flame - deep red, very soft */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 90 * config.scale * intensity,
            height: 200 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(180, 50, 20, 0.9) 0%,
              rgba(200, 70, 30, 0.75) 15%,
              rgba(220, 90, 40, 0.55) 35%,
              rgba(240, 110, 50, 0.3) 55%,
              rgba(255, 130, 60, 0.1) 75%,
              transparent 100%)`,
            borderRadius: '45% 45% 45% 45% / 55% 55% 40% 40%',
            filter: 'blur(18px)',
            transform: 'translateX(-50%)',
            animation: 'flameWaver1 4s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Second outer layer - for depth */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 75 * config.scale * intensity,
            height: 175 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(220, 80, 30, 0.85) 0%,
              rgba(240, 100, 40, 0.7) 20%,
              rgba(255, 120, 50, 0.5) 40%,
              rgba(255, 140, 70, 0.25) 65%,
              transparent 100%)`,
            borderRadius: '48% 48% 45% 45% / 55% 55% 42% 42%',
            filter: 'blur(12px)',
            transform: 'translateX(-50%)',
            animation: 'flameWaver2 3.5s ease-in-out infinite 0.2s',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Middle flame - orange */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 55 * config.scale * intensity,
            height: 145 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 140, 50, 0.95) 0%,
              rgba(255, 160, 70, 0.85) 20%,
              rgba(255, 175, 90, 0.65) 40%,
              rgba(255, 190, 110, 0.4) 60%,
              rgba(255, 200, 130, 0.15) 80%,
              transparent 100%)`,
            borderRadius: '50% 50% 48% 48% / 55% 55% 45% 45%',
            filter: 'blur(8px)',
            transform: 'translateX(-50%)',
            animation: 'flameWaver3 3s ease-in-out infinite 0.1s',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Inner flame - yellow-orange */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 38 * config.scale * intensity,
            height: 110 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 200, 120, 1) 0%,
              rgba(255, 210, 140, 0.9) 20%,
              rgba(255, 215, 160, 0.7) 40%,
              rgba(255, 220, 175, 0.45) 60%,
              rgba(255, 225, 190, 0.2) 80%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 58% 58% 45% 45%',
            filter: 'blur(5px)',
            transform: 'translateX(-50%)',
            animation: 'flameWaver4 2.5s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Core flame - bright yellow/white */}
        <div
          className="absolute bottom-[3%] left-1/2"
          style={{
            width: 22 * config.scale * intensity,
            height: 70 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 250, 230, 0.98) 0%,
              rgba(255, 245, 210, 0.9) 25%,
              rgba(255, 235, 190, 0.7) 50%,
              rgba(255, 225, 170, 0.4) 75%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 45% 45%',
            filter: 'blur(3px)',
            transform: 'translateX(-50%)',
            animation: 'flameCore 2s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Hot white center */}
        <div
          className="absolute bottom-[6%] left-1/2"
          style={{
            width: 12 * config.scale * intensity,
            height: 35 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(255, 255, 245, 0.75) 40%,
              rgba(255, 250, 230, 0.4) 70%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 45% 45%',
            filter: 'blur(2px)',
            transform: 'translateX(-50%)',
            animation: 'coreFlicker 1.5s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Random floating embers */}
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: ember.size * config.scale,
              height: ember.size * config.scale,
              left: `${ember.x}%`,
              bottom: `${ember.y}%`,
              background: `radial-gradient(circle,
                rgba(255, 240, 200, ${ember.opacity}) 0%,
                rgba(255, 180, 100, ${ember.opacity * 0.7}) 40%,
                rgba(255, 140, 80, ${ember.opacity * 0.3}) 70%,
                transparent 100%)`,
              boxShadow: `0 0 ${ember.size * 2}px ${ember.size}px rgba(255, 180, 100, ${ember.opacity * 0.4})`,
              filter: 'blur(0.5px)',
              animation: `emberRise ${ember.duration}s ease-out forwards`,
              '--drift': `${ember.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Listening pulse rings */}
      {isListening && (
        <>
          <div
            className="absolute bottom-[32%] left-1/2 rounded-full pointer-events-none"
            style={{
              width: 80 * config.scale,
              height: 80 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.25)',
              transform: 'translateX(-50%)',
              animation: 'pulseRing 2.5s ease-out infinite',
            }}
          />
          <div
            className="absolute bottom-[32%] left-1/2 rounded-full pointer-events-none"
            style={{
              width: 80 * config.scale,
              height: 80 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.15)',
              transform: 'translateX(-50%)',
              animation: 'pulseRing 2.5s ease-out infinite 0.8s',
            }}
          />
        </>
      )}

      {/* Story ember count */}
      {showEmberCount > 0 && (
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-2">
          {[...Array(Math.min(showEmberCount, 7))].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 6 * config.scale,
                height: 6 * config.scale,
                background: 'radial-gradient(circle, rgba(255, 210, 140, 0.95), rgba(255, 160, 90, 0.7))',
                boxShadow: '0 0 10px 4px rgba(255, 170, 90, 0.4)',
                animation: `storyEmberGlow 3s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tap hint */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[#f9f7f2]/25 text-sm font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            tap to begin
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes ambientPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.92; }
        }

        @keyframes breatheGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.88; }
        }

        @keyframes flameWaver1 {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(0deg); }
          25% { transform: translateX(-50%) scaleX(1.04) scaleY(1.02) rotate(0.5deg); }
          50% { transform: translateX(-50%) scaleX(0.97) scaleY(1.03) rotate(-0.3deg); }
          75% { transform: translateX(-50%) scaleX(1.02) scaleY(0.99) rotate(0.2deg); }
        }

        @keyframes flameWaver2 {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(0deg); }
          30% { transform: translateX(-50%) scaleX(1.06) scaleY(1.03) rotate(-0.5deg); }
          60% { transform: translateX(-50%) scaleX(0.96) scaleY(1.04) rotate(0.4deg); }
        }

        @keyframes flameWaver3 {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1); }
          35% { transform: translateX(-50%) scaleX(1.08) scaleY(1.04) translateX(1px); }
          65% { transform: translateX(-50%) scaleX(0.94) scaleY(1.05) translateX(-1px); }
        }

        @keyframes flameWaver4 {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1); }
          40% { transform: translateX(-50%) scaleX(1.1) scaleY(1.06) translateX(1.5px); }
          70% { transform: translateX(-50%) scaleX(0.92) scaleY(1.08) translateX(-1px); }
        }

        @keyframes flameCore {
          0%, 100% { transform: translateX(-50%) scaleY(1); opacity: 0.95; }
          50% { transform: translateX(-50%) scaleY(1.08); opacity: 1; }
        }

        @keyframes coreFlicker {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.9; }
          30% { transform: translateX(-50%) scale(1.05); opacity: 1; }
          60% { transform: translateX(-50%) scale(0.97); opacity: 0.85; }
        }

        @keyframes emberRise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-200px) translateX(var(--drift)) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes pulseRing {
          0% { transform: translateX(-50%) scale(1); opacity: 0.3; }
          100% { transform: translateX(-50%) scale(2.8); opacity: 0; }
        }

        @keyframes storyEmberGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
