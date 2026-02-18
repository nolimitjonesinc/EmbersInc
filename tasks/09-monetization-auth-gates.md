# Monetization & Auth Gates

> Source: `created by Claude Code monetization sprint`
> Progress: 11/11 tasks done ✓
> Sprint: 6

## Why This Matters

Embers works but has no revenue path. Anonymous users can save unlimited stories without signing up. This sprint adds the "One Free Taste" model: 1 free story → auth gate → free tier (3 stories) → premium ($9.99/mo).

## Tasks

### Foundation
- [x] Create tier constants and feature flags (`src/lib/subscription/tiers.ts`)
  - Tier limits: anonymous=1, free=3, premium=unlimited
  - Feature flags per tier: cloudBackup, narrativeProse, familySharing, photoDetective, lifeBook
- [x] Add subscription fields to Supabase types (`src/lib/supabase/types.ts`)
  - Added `subscription_tier`, `stripe_customer_id`, `subscription_expires_at` to User type
- [x] Create usage tracking hook (`src/lib/subscription/useSubscription.ts`)
  - Combines useAuth() + story count → tier, limits, gate/prompt decisions
  - Checks subscription expiration for premium users

### Auth Gates & Enforcement
- [x] Create AuthGate component — warm sign-up prompt after 1st anonymous story
  - `src/components/subscription/AuthGate.tsx` — inline magic link signup in SessionEnding
  - Warm copy: "Let's make sure it's safe forever" + email input
  - On auth success: triggers local-to-cloud story migration
- [x] Create UpgradePrompt component — nudge when free tier hits 3 stories
  - `src/components/subscription/UpgradePrompt.tsx` — encouraging, non-punishing tone
  - Links to pricing page, shows current story count
- [x] Wire gates into SessionEnding based on tier + usage
  - SessionEnding accepts `showAuthGate`, `showUpgradePrompt`, `storiesCount`, `onAuthSuccess`
  - "Share Another Memory" button hidden when gate/prompt is showing
  - conversation/page.tsx passes subscription state to SessionEnding
- [x] Enforce story limits in SessionEnding UI
  - (CHANGED from useStoryPersistence — stories always save, gate appears after)
  - Story data is NEVER lost — saves to localStorage or Supabase first, then gate shows
- [x] Create local-to-cloud story migration for new sign-ups
  - `src/lib/subscription/migrateLocalStories.ts` — POST each local story to /api/stories
  - Clears localStorage only after successful migration
  - Called by AuthGate on auth success

### Stripe & Pricing
- [x] Stripe server setup (checkout, webhook, portal API routes)
  - `src/lib/stripe/client.ts` — server-side Stripe client (graceful if unconfigured)
  - `src/app/api/stripe/checkout/route.ts` — creates checkout session, requires auth
  - `src/app/api/stripe/webhook/route.ts` — handles checkout.session.completed, subscription.updated, subscription.deleted
  - `src/app/api/stripe/portal/route.ts` — Stripe customer portal for managing subscription
- [x] Create pricing page with Free vs Premium comparison
  - `src/app/pricing/page.tsx` — elderly-friendly, large text, high contrast
  - Free: 3 stories, voice conversations, narrative prose, Life Book
  - Premium ($9.99/mo): unlimited, family sharing, cloud backup, priority support
  - Upgrade button → Stripe checkout; Manage subscription → Stripe portal
- [x] Document Supabase schema updates + environment variables for Danny
  - `docs/setup-stripe.md` — SQL migration, env vars, webhook setup, test instructions

## Dependencies

- Sprints 1-5 complete (auth, error handling, architecture all in place)
- Supabase schema changes needed before Stripe webhooks work (see docs/setup-stripe.md)
- Stripe account + API keys needed before testing payments

## Files Created
- `src/lib/subscription/tiers.ts`
- `src/lib/subscription/useSubscription.ts`
- `src/lib/subscription/migrateLocalStories.ts`
- `src/components/subscription/AuthGate.tsx`
- `src/components/subscription/UpgradePrompt.tsx`
- `src/lib/stripe/client.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/pricing/page.tsx`
- `docs/setup-stripe.md`

## Files Modified
- `src/lib/supabase/types.ts` — subscription fields on User type
- `src/components/conversation/SessionEnding.tsx` — auth gate + upgrade prompt integration
- `src/app/conversation/page.tsx` — subscription hook + gate props to SessionEnding
