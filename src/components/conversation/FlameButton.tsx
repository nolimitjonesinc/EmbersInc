'use client';

import { useEffect, useState } from 'react';

interface FlameButtonProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  showEmberCount?: number;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sizeConfig = {
    small: { scale: 0.5, width: 140, height: 200 },
    medium: { scale: 0.75, width: 200, height: 280 },
    large: { scale: 1, width: 280, height: 380 },
  };

  const config = sizeConfig[size];
  const intensity = isListening ? 1.2 : isSpeaking ? 0.85 : isProcessing ? 0.6 : 1;

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
      {/* Deep ambient glow - the warmth that fills the space */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 70%,
            rgba(255, 120, 50, ${0.3 * intensity}) 0%,
            rgba(200, 80, 40, ${0.15 * intensity}) 30%,
            rgba(150, 50, 20, ${0.08 * intensity}) 50%,
            transparent 70%)`,
          filter: 'blur(40px)',
          transform: `scale(${1.3 + (isListening ? 0.2 : 0)})`,
        }}
      />

      {/* Secondary warm glow layer */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 65%,
            rgba(255, 150, 80, ${0.25 * intensity}) 0%,
            rgba(255, 100, 50, ${0.1 * intensity}) 40%,
            transparent 60%)`,
          filter: 'blur(30px)',
          animation: 'gentleBreath 4s ease-in-out infinite',
        }}
      />

      {/* Flame container - positioned at bottom */}
      <div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2"
        style={{
          width: 100 * config.scale,
          height: 220 * config.scale,
        }}
      >
        {/* Outer flame - deep red/orange, most blur */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 80 * config.scale * intensity,
            height: 180 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(200, 60, 20, 0.9) 0%,
              rgba(220, 80, 30, 0.8) 20%,
              rgba(255, 100, 40, 0.6) 40%,
              rgba(255, 120, 50, 0.3) 70%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'blur(15px)',
            animation: 'flameOuter 3s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Middle flame - orange, medium blur */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 55 * config.scale * intensity,
            height: 150 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 120, 50, 0.95) 0%,
              rgba(255, 140, 60, 0.85) 25%,
              rgba(255, 160, 70, 0.6) 50%,
              rgba(255, 180, 100, 0.3) 75%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'blur(8px)',
            animation: 'flameMiddle 2.5s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Inner flame - yellow/white core, slight blur */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 35 * config.scale * intensity,
            height: 110 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 220, 150, 1) 0%,
              rgba(255, 200, 120, 0.9) 20%,
              rgba(255, 180, 100, 0.7) 45%,
              rgba(255, 160, 80, 0.4) 70%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'blur(4px)',
            animation: 'flameInner 2s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Hot white core */}
        <div
          className="absolute bottom-[5%] left-1/2 -translate-x-1/2"
          style={{
            width: 18 * config.scale * intensity,
            height: 50 * config.scale * intensity,
            background: `linear-gradient(to top,
              rgba(255, 255, 240, 0.95) 0%,
              rgba(255, 240, 200, 0.7) 40%,
              rgba(255, 220, 150, 0.3) 70%,
              transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'blur(2px)',
            animation: 'flameCore 1.8s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Floating embers */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: (2 + Math.random() * 3) * config.scale,
              height: (2 + Math.random() * 3) * config.scale,
              left: `${35 + (i - 4) * 8}%`,
              bottom: '40%',
              background: `radial-gradient(circle,
                rgba(255, 220, 150, 0.9) 0%,
                rgba(255, 150, 80, 0.6) 50%,
                transparent 100%)`,
              boxShadow: `0 0 ${6 * config.scale}px ${3 * config.scale}px rgba(255, 180, 100, 0.4)`,
              filter: 'blur(0.5px)',
              animation: `emberFloat${i % 4} ${4 + i * 0.7}s ease-out infinite`,
              animationDelay: `${i * 0.5}s`,
              opacity: intensity,
            }}
          />
        ))}
      </div>

      {/* Listening pulse ring */}
      {isListening && (
        <>
          <div
            className="absolute bottom-[35%] left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: 60 * config.scale,
              height: 60 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.3)',
              animation: 'pulseRing 2s ease-out infinite',
            }}
          />
          <div
            className="absolute bottom-[35%] left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: 60 * config.scale,
              height: 60 * config.scale,
              border: '1px solid rgba(255, 180, 100, 0.2)',
              animation: 'pulseRing 2s ease-out infinite',
              animationDelay: '0.5s',
            }}
          />
        </>
      )}

      {/* Story ember count */}
      {showEmberCount > 0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-1.5">
          {[...Array(Math.min(showEmberCount, 7))].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 200, 120, 0.9), rgba(255, 140, 80, 0.6))',
                boxShadow: '0 0 8px 3px rgba(255, 160, 80, 0.4)',
                animation: `emberGlow 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tap hint */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[#f9f7f2]/30 text-sm font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            tap to begin
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes gentleBreath {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        @keyframes flameOuter {
          0%, 100% {
            transform: translateX(-50%) scaleX(1) scaleY(1);
          }
          25% {
            transform: translateX(-50%) scaleX(1.05) scaleY(1.02) translateX(2px);
          }
          50% {
            transform: translateX(-50%) scaleX(0.97) scaleY(1.04);
          }
          75% {
            transform: translateX(-50%) scaleX(1.03) scaleY(0.98) translateX(-2px);
          }
        }

        @keyframes flameMiddle {
          0%, 100% {
            transform: translateX(-50%) scaleX(1) scaleY(1);
          }
          30% {
            transform: translateX(-50%) scaleX(1.08) scaleY(1.03) translateX(-1px);
          }
          60% {
            transform: translateX(-50%) scaleX(0.95) scaleY(1.06) translateX(1px);
          }
        }

        @keyframes flameInner {
          0%, 100% {
            transform: translateX(-50%) scaleX(1) scaleY(1);
          }
          35% {
            transform: translateX(-50%) scaleX(1.1) scaleY(1.05) translateX(1px);
          }
          65% {
            transform: translateX(-50%) scaleX(0.92) scaleY(1.08) translateX(-1px);
          }
        }

        @keyframes flameCore {
          0%, 100% {
            transform: translateX(-50%) scaleY(1);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-50%) scaleY(1.1);
            opacity: 1;
          }
        }

        @keyframes emberFloat0 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(-150px) translateX(15px); opacity: 0; }
        }

        @keyframes emberFloat1 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.7; }
          100% { transform: translateY(-180px) translateX(-20px); opacity: 0; }
        }

        @keyframes emberFloat2 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translateY(-130px) translateX(25px); opacity: 0; }
        }

        @keyframes emberFloat3 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(-160px) translateX(-15px); opacity: 0; }
        }

        @keyframes pulseRing {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 0.4;
          }
          100% {
            transform: translateX(-50%) scale(2.5);
            opacity: 0;
          }
        }

        @keyframes emberGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
