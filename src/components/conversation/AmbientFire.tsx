'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface AmbientFireProps {
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
  opacity: number;
  speed: number;
  drift: number;
  life: number;
}

export function AmbientFire({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  onClick,
  size = 'large',
  showEmberCount = 0,
}: AmbientFireProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const embersRef = useRef<Ember[]>([]);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeConfig = {
    small: { width: 120, height: 160, flameScale: 0.6 },
    medium: { width: 180, height: 240, flameScale: 0.8 },
    large: { width: 260, height: 340, flameScale: 1.0 },
  };

  const config = sizeConfig[size];

  // Get intensity based on state
  const getIntensity = useCallback(() => {
    if (isProcessing) return 0.6;
    if (isSpeaking) return 0.85;
    if (isListening) return 1.35;
    return 1.0;
  }, [isListening, isSpeaking, isProcessing]);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = config.width * dpr;
      canvas.height = config.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const animate = () => {
      const width = config.width;
      const height = config.height;
      const intensity = getIntensity();
      const scale = config.flameScale;
      const centerX = width / 2;
      const baseY = height * 0.78;

      timeRef.current += 0.016;
      const time = timeRef.current;

      // Clear with trail effect for smooth flames
      ctx.fillStyle = 'rgba(10, 9, 8, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw ambient glow
      const glowRadius = height * 0.65 * intensity;
      const glowGradient = ctx.createRadialGradient(
        centerX, baseY - height * 0.2,
        0,
        centerX, baseY - height * 0.2,
        glowRadius
      );
      glowGradient.addColorStop(0, `rgba(255, 140, 50, ${0.25 * intensity})`);
      glowGradient.addColorStop(0.25, `rgba(232, 109, 72, ${0.15 * intensity})`);
      glowGradient.addColorStop(0.5, `rgba(196, 90, 58, ${0.08 * intensity})`);
      glowGradient.addColorStop(1, 'rgba(10, 9, 8, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // Flame parameters
      const flameHeight = height * 0.5 * scale * intensity;
      const flameWidth = width * 0.22 * scale;

      // Draw multiple flame layers for realistic depth
      const flameLayers = [
        { widthMult: 1.1, heightMult: 1.0, hueStart: 8, opacity: 0.85 },     // Outer deep red
        { widthMult: 0.85, heightMult: 0.97, hueStart: 15, opacity: 0.9 },   // Red-orange
        { widthMult: 0.65, heightMult: 0.92, hueStart: 25, opacity: 0.85 },  // Orange
        { widthMult: 0.45, heightMult: 0.82, hueStart: 35, opacity: 0.9 },   // Yellow-orange
        { widthMult: 0.25, heightMult: 0.65, hueStart: 45, opacity: 0.95 },  // Yellow core
      ];

      flameLayers.forEach((layer, i) => {
        const layerTime = time * (1 + i * 0.15);

        // Complex flickering with multiple frequencies
        const flicker =
          Math.sin(layerTime * 5) * 0.06 +
          Math.sin(layerTime * 8.3) * 0.04 +
          Math.sin(layerTime * 13.7) * 0.025 +
          Math.sin(layerTime * 21) * 0.015;

        const sway = Math.sin(layerTime * 2.5) * 4 * (1 - i * 0.15);
        const verticalPulse = Math.sin(layerTime * 3) * 0.03;

        const fWidth = flameWidth * layer.widthMult * (1 + flicker);
        const fHeight = flameHeight * layer.heightMult * (1 + flicker * 0.4 + verticalPulse);

        // Flame gradient - from base to tip
        const flameGrad = ctx.createLinearGradient(centerX, baseY, centerX, baseY - fHeight);
        const hue = layer.hueStart;
        flameGrad.addColorStop(0, `hsla(${hue}, 100%, 50%, ${layer.opacity * intensity})`);
        flameGrad.addColorStop(0.15, `hsla(${hue + 5}, 100%, 52%, ${layer.opacity * 0.95 * intensity})`);
        flameGrad.addColorStop(0.4, `hsla(${hue + 12}, 100%, 55%, ${layer.opacity * 0.8 * intensity})`);
        flameGrad.addColorStop(0.7, `hsla(${hue + 18}, 100%, 60%, ${layer.opacity * 0.5 * intensity})`);
        flameGrad.addColorStop(0.9, `hsla(${hue + 25}, 100%, 65%, ${layer.opacity * 0.2 * intensity})`);
        flameGrad.addColorStop(1, `hsla(${hue + 30}, 100%, 70%, 0)`);

        // Draw organic flame shape with bezier curves
        ctx.beginPath();
        ctx.moveTo(centerX - fWidth * 0.5, baseY);

        // Left edge - curves up with organic wobble
        const leftMidX = centerX - fWidth * 0.55 + sway * 0.4 + Math.sin(layerTime * 7) * 2;
        const leftMidY = baseY - fHeight * 0.4;

        ctx.bezierCurveTo(
          leftMidX, leftMidY + fHeight * 0.1,
          centerX - fWidth * 0.25 + sway * 0.7, baseY - fHeight * 0.65,
          centerX + sway + Math.sin(layerTime * 6) * 2, baseY - fHeight
        );

        // Right edge - mirrors back down
        const rightMidX = centerX + fWidth * 0.55 + sway * 0.4 + Math.sin(layerTime * 7 + 1) * 2;
        const rightMidY = baseY - fHeight * 0.4;

        ctx.bezierCurveTo(
          centerX + fWidth * 0.25 + sway * 0.7, baseY - fHeight * 0.65,
          rightMidX, rightMidY + fHeight * 0.1,
          centerX + fWidth * 0.5, baseY
        );

        ctx.closePath();
        ctx.fillStyle = flameGrad;
        ctx.fill();
      });

      // Draw bright inner glow at flame base
      const coreGlow = ctx.createRadialGradient(
        centerX, baseY - flameHeight * 0.12,
        0,
        centerX, baseY - flameHeight * 0.12,
        flameWidth * 0.5 * intensity
      );
      coreGlow.addColorStop(0, `rgba(255, 255, 220, ${0.7 * intensity})`);
      coreGlow.addColorStop(0.3, `rgba(255, 220, 150, ${0.4 * intensity})`);
      coreGlow.addColorStop(0.6, `rgba(255, 180, 100, ${0.2 * intensity})`);
      coreGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, baseY - flameHeight * 0.12, flameWidth * 0.5 * intensity, 0, Math.PI * 2);
      ctx.fill();

      // Spawn embers
      const emberChance = 0.035 * intensity;
      if (Math.random() < emberChance) {
        embersRef.current.push({
          id: Date.now() + Math.random(),
          x: centerX + (Math.random() - 0.5) * flameWidth * 0.9,
          y: baseY - flameHeight * 0.35 - Math.random() * flameHeight * 0.35,
          size: 1.2 + Math.random() * 2.2,
          opacity: 0.7 + Math.random() * 0.3,
          speed: 0.4 + Math.random() * 0.9,
          drift: (Math.random() - 0.5) * 0.35,
          life: 1,
        });
      }

      // Update and draw embers
      embersRef.current = embersRef.current.filter((ember) => {
        ember.y -= ember.speed * intensity;
        ember.x += ember.drift + Math.sin(time * 2.5 + ember.id) * 0.25;
        ember.life -= 0.005;
        ember.opacity = ember.life * 0.75;
        ember.size *= 0.998;

        if (ember.life <= 0 || ember.y < 0) return false;

        // Draw ember with glow
        const emberGrad = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, ember.size * 3.5
        );
        emberGrad.addColorStop(0, `rgba(255, 230, 180, ${ember.opacity})`);
        emberGrad.addColorStop(0.35, `rgba(255, 160, 80, ${ember.opacity * 0.5})`);
        emberGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');

        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = emberGrad;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 230, ${ember.opacity})`;
        ctx.fill();

        return true;
      });

      // Listening indicator - subtle expanding ring
      if (isListening) {
        const ringProgress = (time % 2.2) / 2.2;
        const ringRadius = flameWidth * 0.7 + ringProgress * flameWidth * 1.8;
        const ringOpacity = (1 - ringProgress) * 0.2;

        ctx.beginPath();
        ctx.arc(centerX, baseY - flameHeight * 0.35, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 180, 100, ${ringOpacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Story ember indicators at the base
      if (showEmberCount > 0) {
        const emberCount = Math.min(showEmberCount, 7);
        const spacing = flameWidth * 1.5 / (emberCount + 1);
        const startX = centerX - (flameWidth * 0.75) + spacing;

        for (let i = 0; i < emberCount; i++) {
          const ex = startX + i * spacing;
          const ey = baseY + 12;
          const pulse = 0.6 + Math.sin(time * 1.5 + i * 0.5) * 0.4;

          const storyGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5);
          storyGrad.addColorStop(0, `rgba(255, 200, 120, ${pulse})`);
          storyGrad.addColorStop(0.5, `rgba(232, 109, 72, ${pulse * 0.6})`);
          storyGrad.addColorStop(1, 'rgba(196, 90, 58, 0)');

          ctx.beginPath();
          ctx.arc(ex, ey, 4, 0, Math.PI * 2);
          ctx.fillStyle = storyGrad;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, config, getIntensity, isListening, showEmberCount]);

  if (!mounted) return null;

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
      <canvas
        ref={canvasRef}
        style={{
          width: config.width,
          height: config.height,
          display: 'block',
        }}
      />

      {/* Tap hint */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[#f9f7f2]/30 text-sm font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            tap to begin
          </p>
        </div>
      )}
    </div>
  );
}
