'use client';

import { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  driftX: number;
  duration: number;
  delay: number;
}

interface EmberParticlesProps {
  isActive?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function EmberParticles({
  isActive = true,
  intensity = 'low',
}: EmberParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const getConfig = useCallback(() => {
    switch (intensity) {
      case 'high':
        return { maxParticles: 8, spawnInterval: 800 };
      case 'medium':
        return { maxParticles: 5, spawnInterval: 1500 };
      default:
        return { maxParticles: 3, spawnInterval: 3000 };
    }
  }, [intensity]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const config = getConfig();
    let particleId = 0;

    const spawnParticle = () => {
      if (particles.length >= config.maxParticles) return;

      const newParticle: Particle = {
        id: particleId++,
        x: 50 + (Math.random() - 0.5) * 20, // Center-ish, with some variance
        y: 60, // Start near the ember
        size: 2 + Math.random() * 3,
        driftX: (Math.random() - 0.5) * 30,
        duration: 3000 + Math.random() * 2000,
        delay: 0,
      };

      setParticles((prev) => [...prev.slice(-config.maxParticles + 1), newParticle]);
    };

    const interval = setInterval(spawnParticle, config.spawnInterval);

    // Spawn one immediately
    spawnParticle();

    return () => clearInterval(interval);
  }, [isActive, getConfig, particles.length]);

  // Clean up finished particles
  useEffect(() => {
    if (particles.length === 0) return;

    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timeout);
  }, [particles]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, #f4a574 0%, #E86D48 50%, transparent 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px rgba(232, 109, 72, 0.3)`,
            animation: `ember-particle-rise ${particle.duration}ms ease-out forwards`,
            '--drift-x': `${particle.driftX}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
