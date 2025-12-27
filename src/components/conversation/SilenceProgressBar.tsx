'use client';

import { SilenceStage } from '@/lib/speech/useSpeechRecognition';

interface SilenceProgressBarProps {
  stage: SilenceStage;
  progress: number; // 0 to 1
  message: string;
  isVisible: boolean;
}

export function SilenceProgressBar({
  stage,
  progress,
  message,
  isVisible,
}: SilenceProgressBarProps) {
  if (!isVisible) return null;

  // Color based on stage (matching iOS)
  const getStageColor = () => {
    switch (stage) {
      case 'detected':
        return {
          bg: 'bg-blue-500',
          glow: 'rgba(59, 130, 246, 0.5)',
          text: 'text-blue-400',
        };
      case 'preparing':
        return {
          bg: 'bg-orange-500',
          glow: 'rgba(249, 115, 22, 0.5)',
          text: 'text-orange-400',
        };
      case 'readyToSend':
        return {
          bg: 'bg-green-500',
          glow: 'rgba(34, 197, 94, 0.5)',
          text: 'text-green-400',
        };
      default:
        return {
          bg: 'bg-white/20',
          glow: 'rgba(255, 255, 255, 0.2)',
          text: 'text-white/50',
        };
    }
  };

  const colors = getStageColor();

  // Pulse animation speed based on stage
  const getPulseClass = () => {
    switch (stage) {
      case 'detected':
        return 'animate-pulse';
      case 'preparing':
        return 'animate-[pulse_0.75s_ease-in-out_infinite]';
      case 'readyToSend':
        return 'animate-[pulse_0.5s_ease-in-out_infinite]';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
      {/* Status message */}
      {message && (
        <p className={`text-sm ${colors.text} ${getPulseClass()} transition-colors duration-300`}>
          {message}
        </p>
      )}

      {/* Progress bar container */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-100 ease-linear`}
          style={{
            width: `${progress * 100}%`,
            boxShadow: `0 0 10px ${colors.glow}`,
          }}
        />
      </div>
    </div>
  );
}
