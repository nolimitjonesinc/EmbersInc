'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { migrateLocalStories } from '@/lib/subscription/migrateLocalStories';

interface AuthGateProps {
  userName?: string;
  storyTitle?: string;
  onAuthSuccess: () => void;
}

/**
 * AuthGate — warm, elderly-friendly sign-up prompt.
 *
 * Shown inline after an anonymous user's 1st story saves.
 * Uses magic link (same as login page). On success, migrates
 * local stories to Supabase.
 */
export function AuthGate({ userName, storyTitle, onAuthSuccess }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/conversation`,
        },
      });

      if (authError) {
        setError('We had trouble sending the link. Please try again.');
        return;
      }

      setIsSent(true);

      // Listen for auth state change (when user clicks magic link)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event) => {
          if (event === 'SIGNED_IN') {
            // Migrate local stories to cloud
            await migrateLocalStories();
            subscription.unsubscribe();
            onAuthSuccess();
          }
        }
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Warm message */}
      <div className="text-center space-y-3">
        <p className="text-xl font-serif text-[#f9f7f2]/90">
          {storyTitle
            ? `"${storyTitle}" is a beautiful story${userName ? `, ${userName}` : ''}.`
            : `That was a beautiful story${userName ? `, ${userName}` : ''}.`
          }
        </p>
        <p className="text-lg text-[#f9f7f2]/60 font-serif">
          Let&apos;s make sure it&apos;s safe forever.
        </p>
      </div>

      {/* Sign-up form */}
      <div className="bg-white/[0.05] border border-white/[0.1] rounded-2xl p-6 max-w-sm mx-auto">
        {!isSent ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <p className="text-[#f9f7f2]/50 text-sm text-center">
              Enter your email and we&apos;ll send you a secure link — no password needed.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.15] text-[#f9f7f2] placeholder-[#f9f7f2]/30 focus:border-[#E86D48]/50 focus:ring-2 focus:ring-[#E86D48]/20 outline-none transition-all text-base"
              aria-label="Email address"
            />

            {error && (
              <p className="text-amber-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3 px-4 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                boxShadow: '0 0 20px rgba(232, 109, 72, 0.3)',
              }}
            >
              {isLoading ? 'Sending...' : 'Save My Stories'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-3 py-2">
            <div className="text-3xl">&#9993;</div>
            <p className="text-[#f9f7f2]/80 font-serif">
              Check your email for a magic link.
            </p>
            <p className="text-[#f9f7f2]/40 text-sm">
              Click the link and your stories will be backed up to the cloud automatically.
            </p>
          </div>
        )}
      </div>

      {/* Skip option */}
      {!isSent && (
        <p className="text-[#f9f7f2]/30 text-xs text-center">
          Your story is saved on this device. Sign up to back it up safely.
        </p>
      )}
    </div>
  );
}
