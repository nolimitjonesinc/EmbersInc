'use client';

import Link from 'next/link';
import { TIER_LIMITS, PREMIUM_PRICE_MONTHLY } from '@/lib/subscription/tiers';

interface UpgradePromptProps {
  storiesCount: number;
  userName?: string;
}

/**
 * UpgradePrompt — warm nudge when a free-tier user hits their story limit.
 *
 * Shown inline in SessionEnding. Links to pricing page for Stripe checkout.
 * Tone: encouraging, never punishing. The user should feel celebrated,
 * not restricted.
 */
export function UpgradePrompt({ storiesCount, userName }: UpgradePromptProps) {
  return (
    <div className="bg-gradient-to-br from-[#E86D48]/10 to-amber-500/10 border border-[#E86D48]/20 rounded-2xl p-6 max-w-sm mx-auto space-y-4 animate-fade-in">
      <div className="text-center space-y-2">
        <p className="text-lg font-serif text-[#f9f7f2]/90">
          You&apos;ve saved {storiesCount} {storiesCount === 1 ? 'story' : 'stories'}{userName ? `, ${userName}` : ''} — that&apos;s wonderful!
        </p>
        <p className="text-[#f9f7f2]/60 text-sm">
          Upgrade to keep sharing unlimited memories, plus get family sharing and more.
        </p>
      </div>

      <Link
        href="/pricing"
        className="block w-full py-3 px-4 rounded-xl text-white font-medium text-center transition-all hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
          boxShadow: '0 0 20px rgba(232, 109, 72, 0.3)',
        }}
      >
        Upgrade for ${PREMIUM_PRICE_MONTHLY}/month
      </Link>

      <p className="text-[#f9f7f2]/30 text-xs text-center">
        Your {TIER_LIMITS.free} free stories are safe. Upgrade anytime.
      </p>
    </div>
  );
}
