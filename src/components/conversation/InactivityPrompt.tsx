'use client';

interface InactivityPromptProps {
  isVisible: boolean;
  onContinue: () => void;
  onSaveAndExit: () => void;
}

export function InactivityPrompt({
  isVisible,
  onContinue,
  onSaveAndExit,
}: InactivityPromptProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#1a1714]/80 backdrop-blur-md" />

      {/* Prompt card */}
      <div className="relative bg-[#1a1714] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center animate-fade-up">
        {/* Ember glow */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <span
            className="block w-12 h-12 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
              boxShadow: '0 0 30px 10px rgba(232, 109, 72, 0.4)',
            }}
          />
        </div>

        <h3 className="text-2xl font-serif text-[#f9f7f2] mt-4 mb-3">
          Still thinking?
        </h3>
        <p className="text-[#f9f7f2]/50 mb-8">
          Take all the time you need. I&apos;m here whenever you&apos;re ready.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full py-3 px-6 rounded-full text-white font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
              boxShadow: '0 0 20px rgba(232, 109, 72, 0.3)',
            }}
          >
            Continue
          </button>
          <button
            onClick={onSaveAndExit}
            className="w-full py-3 px-6 rounded-full text-[#f9f7f2]/70 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
}
