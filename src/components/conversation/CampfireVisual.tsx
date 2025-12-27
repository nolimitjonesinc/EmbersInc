'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CampfireVisualProps {
  isActive: boolean; // Fire burns brighter when user is speaking
  isListening: boolean;
  isSpeaking: boolean; // AI speaking - fire settles, listens
  isProcessing: boolean;
  intensity?: 'dormant' | 'gentle' | 'alive' | 'bright';
  onFireClick?: () => void;
  showEmbers?: number; // Number of story embers to show in the coals
  enableSound?: boolean;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  life: number;
}

interface Flame {
  id: number;
  x: number;
  height: number;
  width: number;
  speed: number;
  delay: number;
  hue: number;
}

export function CampfireVisual({
  isActive,
  isListening,
  isSpeaking,
  isProcessing,
  intensity = 'gentle',
  onFireClick,
  showEmbers = 0,
  enableSound = false,
}: CampfireVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const sparksRef = useRef<Spark[]>([]);
  const flamesRef = useRef<Flame[]>([]);
  const timeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  // Determine fire intensity based on state
  const getIntensityMultiplier = useCallback(() => {
    if (isProcessing) return 0.6; // Thinking - fire dims slightly
    if (isSpeaking) return 0.8; // AI speaking - fire settles to listen
    if (isListening && isActive) return 1.4; // User actively speaking - fire grows
    if (isListening) return 1.1; // Listening but quiet
    if (isHovered) return 1.05;
    return 1.0;
  }, [isActive, isListening, isSpeaking, isProcessing, isHovered]);

  // Initialize flames
  useEffect(() => {
    const flameCount = 12;
    flamesRef.current = Array.from({ length: flameCount }, (_, i) => ({
      id: i,
      x: 0.3 + (i / flameCount) * 0.4 + (Math.random() - 0.5) * 0.1,
      height: 0.4 + Math.random() * 0.3,
      width: 0.08 + Math.random() * 0.06,
      speed: 0.5 + Math.random() * 0.5,
      delay: Math.random() * Math.PI * 2,
      hue: 20 + Math.random() * 25, // Orange to yellow range
    }));
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const intensityMult = getIntensityMultiplier();

      timeRef.current += 0.016; // ~60fps

      // Clear canvas with slight trail for smooth effect
      ctx.fillStyle = 'rgba(18, 17, 16, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw ambient glow
      const glowRadius = height * 0.6 * intensityMult;
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.75,
        0,
        width / 2,
        height * 0.75,
        glowRadius
      );
      gradient.addColorStop(0, `rgba(232, 109, 72, ${0.15 * intensityMult})`);
      gradient.addColorStop(0.5, `rgba(196, 90, 58, ${0.08 * intensityMult})`);
      gradient.addColorStop(1, 'rgba(18, 17, 16, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw coals/ember bed
      const coalY = height * 0.78;
      const coalWidth = width * 0.5;
      const coalX = (width - coalWidth) / 2;

      // Glowing coal bed
      const coalGradient = ctx.createRadialGradient(
        width / 2,
        coalY,
        0,
        width / 2,
        coalY,
        coalWidth * 0.6
      );
      coalGradient.addColorStop(0, `rgba(255, 100, 50, ${0.8 * intensityMult})`);
      coalGradient.addColorStop(0.3, `rgba(200, 60, 30, ${0.6 * intensityMult})`);
      coalGradient.addColorStop(0.6, `rgba(120, 40, 20, ${0.4 * intensityMult})`);
      coalGradient.addColorStop(1, 'rgba(40, 20, 10, 0)');

      ctx.beginPath();
      ctx.ellipse(width / 2, coalY, coalWidth * 0.5, height * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = coalGradient;
      ctx.fill();

      // Draw individual coals with pulsing glow
      const coalCount = 8;
      for (let i = 0; i < coalCount; i++) {
        const coalAngle = (i / coalCount) * Math.PI * 2 + timeRef.current * 0.1;
        const coalRadius = coalWidth * 0.25 + Math.sin(coalAngle * 3 + i) * coalWidth * 0.1;
        const cx = width / 2 + Math.cos(coalAngle) * coalRadius * 0.7;
        const cy = coalY + Math.sin(coalAngle) * height * 0.03;
        const pulse = 0.5 + Math.sin(timeRef.current * 2 + i * 0.7) * 0.3;
        const coalSize = 8 + Math.random() * 6;

        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coalSize * intensityMult);
        cGrad.addColorStop(0, `rgba(255, 150, 80, ${pulse * intensityMult})`);
        cGrad.addColorStop(0.5, `rgba(200, 80, 40, ${pulse * 0.5 * intensityMult})`);
        cGrad.addColorStop(1, 'rgba(100, 40, 20, 0)');

        ctx.beginPath();
        ctx.arc(cx, cy, coalSize * intensityMult, 0, Math.PI * 2);
        ctx.fillStyle = cGrad;
        ctx.fill();
      }

      // Draw story embers (saved stories represented as glowing embers)
      if (showEmbers > 0) {
        for (let i = 0; i < Math.min(showEmbers, 12); i++) {
          const angle = (i / Math.min(showEmbers, 12)) * Math.PI + Math.PI;
          const radius = coalWidth * 0.3;
          const ex = width / 2 + Math.cos(angle) * radius;
          const ey = coalY + Math.sin(angle) * height * 0.02 - 5;
          const pulse = 0.7 + Math.sin(timeRef.current * 1.5 + i) * 0.3;

          const emberGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
          emberGrad.addColorStop(0, `rgba(255, 200, 100, ${pulse})`);
          emberGrad.addColorStop(0.4, `rgba(232, 109, 72, ${pulse * 0.7})`);
          emberGrad.addColorStop(1, 'rgba(196, 90, 58, 0)');

          ctx.beginPath();
          ctx.arc(ex, ey, 10, 0, Math.PI * 2);
          ctx.fillStyle = emberGrad;
          ctx.fill();
        }
      }

      // Draw flames
      flamesRef.current.forEach((flame) => {
        const time = timeRef.current * flame.speed + flame.delay;
        const flicker = Math.sin(time * 3) * 0.15 + Math.sin(time * 7) * 0.1;
        const heightMod = (1 + flicker) * intensityMult;

        const fx = width * flame.x + Math.sin(time * 2) * 8;
        const fy = coalY - 10;
        const fHeight = height * flame.height * heightMod;
        const fWidth = width * flame.width * (0.8 + flicker * 0.4);

        // Flame gradient
        const flameGrad = ctx.createLinearGradient(fx, fy, fx, fy - fHeight);
        flameGrad.addColorStop(0, `hsla(${flame.hue}, 100%, 50%, ${0.9 * intensityMult})`);
        flameGrad.addColorStop(0.3, `hsla(${flame.hue + 10}, 100%, 55%, ${0.7 * intensityMult})`);
        flameGrad.addColorStop(0.6, `hsla(${flame.hue + 20}, 100%, 60%, ${0.4 * intensityMult})`);
        flameGrad.addColorStop(1, 'hsla(45, 100%, 70%, 0)');

        // Draw flame shape using bezier curves
        ctx.beginPath();
        ctx.moveTo(fx - fWidth / 2, fy);
        ctx.quadraticCurveTo(
          fx - fWidth / 3,
          fy - fHeight * 0.5,
          fx + Math.sin(time * 4) * 3,
          fy - fHeight
        );
        ctx.quadraticCurveTo(
          fx + fWidth / 3,
          fy - fHeight * 0.5,
          fx + fWidth / 2,
          fy
        );
        ctx.closePath();
        ctx.fillStyle = flameGrad;
        ctx.fill();
      });

      // Spawn new sparks
      const sparkChance = 0.03 * intensityMult;
      if (Math.random() < sparkChance) {
        sparksRef.current.push({
          id: Date.now() + Math.random(),
          x: width / 2 + (Math.random() - 0.5) * coalWidth * 0.6,
          y: coalY - height * 0.15,
          size: 1.5 + Math.random() * 2.5,
          opacity: 0.8 + Math.random() * 0.2,
          speed: 0.8 + Math.random() * 1.2,
          drift: (Math.random() - 0.5) * 0.5,
          life: 1,
        });
      }

      // Update and draw sparks
      sparksRef.current = sparksRef.current.filter((spark) => {
        spark.y -= spark.speed * intensityMult;
        spark.x += spark.drift + Math.sin(timeRef.current * 3 + spark.id) * 0.3;
        spark.life -= 0.008;
        spark.opacity = spark.life * 0.8;
        spark.size *= 0.995;

        if (spark.life <= 0 || spark.y < 0) return false;

        // Draw spark with glow
        const sparkGrad = ctx.createRadialGradient(
          spark.x,
          spark.y,
          0,
          spark.x,
          spark.y,
          spark.size * 3
        );
        sparkGrad.addColorStop(0, `rgba(255, 220, 150, ${spark.opacity})`);
        sparkGrad.addColorStop(0.3, `rgba(255, 150, 80, ${spark.opacity * 0.6})`);
        sparkGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');

        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = sparkGrad;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${spark.opacity})`;
        ctx.fill();

        return true;
      });

      // Draw listening indicator ring
      if (isListening) {
        const ringProgress = (timeRef.current % 3) / 3;
        const ringRadius = 30 + ringProgress * 50;
        const ringOpacity = (1 - ringProgress) * 0.3;

        ctx.beginPath();
        ctx.arc(width / 2, coalY - height * 0.15, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 109, 72, ${ringOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getIntensityMultiplier, isListening, showEmbers]);

  // Handle crackling sound
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      // Would load crackling audio here
      // audioRef.current = new Audio('/sounds/fire-crackle.mp3');
      // audioRef.current.loop = true;
      // audioRef.current.volume = 0.3;
      // audioRef.current.play();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [enableSound]);

  return (
    <div
      className="relative w-full h-full cursor-pointer"
      onClick={onFireClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={isListening ? 'Fire is listening - tap to stop' : 'Tap the fire to begin sharing'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFireClick?.();
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Subtle instruction text */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[#f9f7f2]/40 text-sm font-serif animate-pulse">
            Tap the fire to begin
          </p>
        </div>
      )}

      {/* Status overlays */}
      {isListening && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[#f9f7f2]/70 text-sm font-serif">
            The fire is listening...
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[#f9f7f2]/50 text-sm font-serif">
            Thinking...
          </p>
        </div>
      )}
    </div>
  );
}
