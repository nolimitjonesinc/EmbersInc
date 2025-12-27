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

  // Generate random embers continuously from wide area
  useEffect(() => {
    if (!mounted) return;

    const spawnEmber = () => {
      const newEmber: Ember = {
        id: emberIdRef.current++,
        x: 15 + Math.random() * 70, // Wider spawn area (15-85%)
        y: 35 + Math.random() * 30, // Start from within flame area
        size: 2 + Math.random() * 5,
        duration: 4 + Math.random() * 4, // 4-8 seconds for longer travel
        drift: -50 + Math.random() * 100, // Wider horizontal drift
        opacity: 0.4 + Math.random() * 0.6,
      };

      setEmbers(prev => [...prev.slice(-20), newEmber]); // Keep max 20 embers
    };

    // Spawn embers at random intervals
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.25) { // 75% chance to spawn
        spawnEmber();
      }
    }, 350);

    // Initial embers
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnEmber(), i * 150);
    }

    return () => clearInterval(spawnInterval);
  }, [mounted]);

  if (!mounted) return null;

  const sizeConfig = {
    small: { scale: 0.5, width: 180, height: 240 },
    medium: { scale: 0.75, width: 260, height: 340 },
    large: { scale: 1, width: 360, height: 450 },
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
      {/* Deep background warmth - LARGER */}
      <div
        className="absolute transition-all duration-1000"
        style={{
          top: '-30%',
          left: '-40%',
          right: '-40%',
          bottom: '-20%',
          background: `radial-gradient(ellipse 100% 80% at 50% 60%,
            rgba(180, 80, 30, ${0.25 * intensity}) 0%,
            rgba(140, 60, 25, ${0.15 * intensity}) 30%,
            rgba(100, 40, 15, ${0.08 * intensity}) 50%,
            transparent 70%)`,
          filter: 'blur(80px)',
          transform: `scale(${1.5 + (isListening ? 0.25 : 0)})`,
        }}
      />

      {/* Primary ambient glow - LARGER */}
      <div
        className="absolute transition-all duration-700"
        style={{
          top: '-20%',
          left: '-30%',
          right: '-30%',
          bottom: '-10%',
          background: `radial-gradient(ellipse 80% 65% at 50% 55%,
            rgba(255, 130, 50, ${0.4 * intensity}) 0%,
            rgba(240, 100, 45, ${0.25 * intensity}) 25%,
            rgba(200, 70, 35, ${0.12 * intensity}) 45%,
            transparent 65%)`,
          filter: 'blur(50px)',
          animation: 'ambientPulse 5s ease-in-out infinite',
        }}
      />

      {/* Secondary breathing glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 55%,
            rgba(255, 160, 80, ${0.35 * intensity}) 0%,
            rgba(255, 130, 65, ${0.18 * intensity}) 35%,
            transparent 55%)`,
          filter: 'blur(35px)',
          animation: 'breatheGlow 4s ease-in-out infinite 0.5s',
        }}
      />

      {/* Flame container - wider */}
      <div
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2"
        style={{
          width: 180 * config.scale,
          height: 280 * config.scale,
        }}
      >
        {/* Base glow at flame bottom - wider */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 160 * config.scale * intensity,
            height: 50 * config.scale * intensity,
            background: `radial-gradient(ellipse at center,
              rgba(255, 210, 120, ${0.9 * intensity}) 0%,
              rgba(255, 160, 90, ${0.5 * intensity}) 40%,
              transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />

        {/* LEFT FLAME TONGUE */}
        <div
          className="absolute bottom-0"
          style={{
            left: '25%',
            width: 50 * config.scale * intensity,
            height: 160 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(220, 90, 35, 0.9) 0%,
              rgba(240, 110, 45, 0.7) 25%,
              rgba(255, 140, 60, 0.45) 50%,
              rgba(255, 160, 80, 0.2) 75%,
              transparent 100%)`,
            borderRadius: '45% 45% 48% 48% / 60% 60% 42% 42%',
            filter: 'blur(12px)',
            transform: 'translateX(-50%)',
            animation: 'flameTongueLeft 3.2s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* RIGHT FLAME TONGUE */}
        <div
          className="absolute bottom-0"
          style={{
            left: '75%',
            width: 50 * config.scale * intensity,
            height: 150 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(210, 85, 30, 0.85) 0%,
              rgba(235, 105, 42, 0.65) 25%,
              rgba(250, 135, 58, 0.4) 50%,
              rgba(255, 155, 75, 0.18) 75%,
              transparent 100%)`,
            borderRadius: '45% 45% 48% 48% / 58% 58% 44% 44%',
            filter: 'blur(12px)',
            transform: 'translateX(-50%)',
            animation: 'flameTongueRight 3.5s ease-in-out infinite 0.3s',
            transformOrigin: 'bottom center',
          }}
        />

        {/* CENTER-LEFT FLAME */}
        <div
          className="absolute bottom-0"
          style={{
            left: '40%',
            width: 55 * config.scale * intensity,
            height: 190 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(240, 100, 40, 0.92) 0%,
              rgba(250, 120, 50, 0.75) 20%,
              rgba(255, 145, 65, 0.5) 45%,
              rgba(255, 165, 85, 0.25) 70%,
              transparent 100%)`,
            borderRadius: '48% 48% 46% 46% / 58% 58% 44% 44%',
            filter: 'blur(10px)',
            transform: 'translateX(-50%)',
            animation: 'flameTongueCenterLeft 2.8s ease-in-out infinite 0.1s',
            transformOrigin: 'bottom center',
          }}
        />

        {/* CENTER-RIGHT FLAME */}
        <div
          className="absolute bottom-0"
          style={{
            left: '60%',
            width: 55 * config.scale * intensity,
            height: 185 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(235, 95, 38, 0.9) 0%,
              rgba(248, 118, 48, 0.72) 20%,
              rgba(255, 142, 62, 0.48) 45%,
              rgba(255, 162, 82, 0.22) 70%,
              transparent 100%)`,
            borderRadius: '46% 46% 48% 48% / 56% 56% 46% 46%',
            filter: 'blur(10px)',
            transform: 'translateX(-50%)',
            animation: 'flameTongueCenterRight 3s ease-in-out infinite 0.2s',
            transformOrigin: 'bottom center',
          }}
        />

        {/* MAIN CENTER FLAME - tallest */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 70 * config.scale * intensity,
            height: 220 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 140, 50, 0.95) 0%,
              rgba(255, 160, 70, 0.85) 15%,
              rgba(255, 175, 90, 0.65) 35%,
              rgba(255, 190, 110, 0.4) 55%,
              rgba(255, 205, 130, 0.18) 75%,
              transparent 100%)`,
            borderRadius: '50% 50% 48% 48% / 55% 55% 45% 45%',
            filter: 'blur(8px)',
            transform: 'translateX(-50%)',
            animation: 'flameCenter 2.6s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Inner bright flame */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 45 * config.scale * intensity,
            height: 150 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 210, 140, 1) 0%,
              rgba(255, 220, 160, 0.9) 20%,
              rgba(255, 225, 175, 0.7) 40%,
              rgba(255, 230, 190, 0.4) 60%,
              rgba(255, 235, 200, 0.15) 80%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 58% 58% 45% 45%',
            filter: 'blur(5px)',
            transform: 'translateX(-50%)',
            animation: 'flameInner 2.2s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Core bright yellow/white */}
        <div
          className="absolute bottom-[2%] left-1/2"
          style={{
            width: 28 * config.scale * intensity,
            height: 90 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 250, 235, 0.98) 0%,
              rgba(255, 248, 220, 0.9) 25%,
              rgba(255, 240, 200, 0.7) 50%,
              rgba(255, 230, 180, 0.4) 75%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 45% 45%',
            filter: 'blur(3px)',
            transform: 'translateX(-50%)',
            animation: 'flameCore 1.8s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Hot white center */}
        <div
          className="absolute bottom-[5%] left-1/2"
          style={{
            width: 14 * config.scale * intensity,
            height: 45 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(255, 255, 250, 0.8) 40%,
              rgba(255, 252, 240, 0.45) 70%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 45% 45%',
            filter: 'blur(2px)',
            transform: 'translateX(-50%)',
            animation: 'coreFlicker 1.4s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Random floating embers - from wider area */}
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
                rgba(255, 245, 210, ${ember.opacity}) 0%,
                rgba(255, 190, 110, ${ember.opacity * 0.7}) 40%,
                rgba(255, 150, 85, ${ember.opacity * 0.3}) 70%,
                transparent 100%)`,
              boxShadow: `0 0 ${ember.size * 2.5}px ${ember.size * 1.2}px rgba(255, 180, 100, ${ember.opacity * 0.45})`,
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
            className="absolute bottom-[30%] left-1/2 rounded-full pointer-events-none"
            style={{
              width: 100 * config.scale,
              height: 100 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.2)',
              transform: 'translateX(-50%)',
              animation: 'pulseRing 2.5s ease-out infinite',
            }}
          />
          <div
            className="absolute bottom-[30%] left-1/2 rounded-full pointer-events-none"
            style={{
              width: 100 * config.scale,
              height: 100 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.12)',
              transform: 'translateX(-50%)',
              animation: 'pulseRing 2.5s ease-out infinite 0.8s',
            }}
          />
        </>
      )}

      {/* Story ember count */}
      {showEmberCount > 0 && (
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 flex gap-2">
          {[...Array(Math.min(showEmberCount, 7))].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 6 * config.scale,
                height: 6 * config.scale,
                background: 'radial-gradient(circle, rgba(255, 215, 150, 0.95), rgba(255, 165, 95, 0.7))',
                boxShadow: '0 0 12px 5px rgba(255, 175, 95, 0.4)',
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
          50% { transform: scale(1.04); opacity: 0.9; }
        }

        @keyframes breatheGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.07); opacity: 0.85; }
        }

        @keyframes flameTongueLeft {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(-2deg); }
          30% { transform: translateX(-50%) scaleX(1.08) scaleY(1.04) rotate(-1deg); }
          60% { transform: translateX(-50%) scaleX(0.94) scaleY(1.06) rotate(-3deg); }
        }

        @keyframes flameTongueRight {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(2deg); }
          35% { transform: translateX(-50%) scaleX(1.06) scaleY(1.05) rotate(3deg); }
          65% { transform: translateX(-50%) scaleX(0.95) scaleY(1.04) rotate(1deg); }
        }

        @keyframes flameTongueCenterLeft {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(-0.5deg); }
          40% { transform: translateX(-50%) scaleX(1.1) scaleY(1.05) rotate(0.5deg) translateX(-2px); }
          70% { transform: translateX(-50%) scaleX(0.93) scaleY(1.07) rotate(-1deg); }
        }

        @keyframes flameTongueCenterRight {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1) rotate(0.5deg); }
          35% { transform: translateX(-50%) scaleX(1.08) scaleY(1.06) rotate(-0.5deg) translateX(2px); }
          65% { transform: translateX(-50%) scaleX(0.94) scaleY(1.05) rotate(1deg); }
        }

        @keyframes flameCenter {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1); }
          25% { transform: translateX(-50%) scaleX(1.06) scaleY(1.03) translateX(1px); }
          50% { transform: translateX(-50%) scaleX(0.96) scaleY(1.05); }
          75% { transform: translateX(-50%) scaleX(1.03) scaleY(0.98) translateX(-1px); }
        }

        @keyframes flameInner {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1); }
          35% { transform: translateX(-50%) scaleX(1.12) scaleY(1.06) translateX(1.5px); }
          70% { transform: translateX(-50%) scaleX(0.9) scaleY(1.08) translateX(-1px); }
        }

        @keyframes flameCore {
          0%, 100% { transform: translateX(-50%) scaleY(1); opacity: 0.95; }
          50% { transform: translateX(-50%) scaleY(1.1); opacity: 1; }
        }

        @keyframes coreFlicker {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.88; }
          25% { transform: translateX(-50%) scale(1.06); opacity: 1; }
          50% { transform: translateX(-50%) scale(0.96); opacity: 0.82; }
          75% { transform: translateX(-50%) scale(1.03); opacity: 0.95; }
        }

        @keyframes emberRise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          85% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(-280px) translateX(var(--drift)) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes pulseRing {
          0% { transform: translateX(-50%) scale(1); opacity: 0.25; }
          100% { transform: translateX(-50%) scale(3); opacity: 0; }
        }

        @keyframes storyEmberGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
