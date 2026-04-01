# Invisible Save & Backup — Goals

**Created:** 2026-03-31
**Status:** Planning
**Priority:** Critical — this replaces the current save/backup model

---

## The Problem

Embers currently expects elderly users to understand browser storage, account creation, and backup decisions. That's a product-ending mistake for this audience. "Saved locally" sounds like "safe" to a 78-year-old — but it's not, and we're lying by omission.

## The Principle

> If Embers says "saved," it must mean "actually safe."
> The user makes **zero** technical decisions about storage, backup, or recovery.

---

## Goals

### 1. Automatic Local Autosave (Crash Cushion)
- Every conversation autosaves locally every few seconds
- No user action required — it just happens
- Protects against browser crashes, accidental closes, lost connections
- This is the safety net, not the solution

### 2. Automatic Cloud Backup (Real Safety)
- Cloud backup starts as soon as identity is established
- No "choose where to save" — there is no choice
- User hears "You're backed up now" and never thinks about it again
- Everything syncs automatically from that point forward

### 3. Invisible Identity (Near-Zero Friction)
- Account creation must NOT block the first conversation
- Identity is captured through voice or a single tap — not a signup form
- Family-started accounts mean the elder never sees login at all
- Solo users give a phone number or email by voice, get a one-tap confirmation

### 4. Family-First Account Model (Default Path)
- Family member (daughter/son) creates the account
- Adds parent/grandparent as a user
- Sends one link — elder taps it and starts talking
- Cloud backup is already configured before the elder arrives
- This is the primary onboarding path, not the fallback

### 5. Honest Save Language
- Never say "saved" unless it means "recoverable from any device"
- Local-only saves get language like "protected for now" (not "saved")
- Cloud-backed saves get "safe and backed up"
- The user always knows the truth without understanding the tech

### 6. Recovery Without Tech Literacy
- If a device is lost, the elder (or family) can recover everything
- Recovery flow is voice-guided or family-assisted
- No password resets, no "check your email" loops
- Magic links or family-member recovery only

---

## Success Criteria

- **Zero-decision save:** User never chooses where or how to save
- **Sub-5-second backup enrollment:** From "what's your phone number?" to "you're backed up"
- **100% cloud backup rate** for users who complete enrollment
- **Family setup < 2 minutes:** From family member signup to elder's first conversation
- **No data loss** after browser clear, device swap, or accidental close (for enrolled users)

---

## What This Replaces

The current model where:
- Guest users save to localStorage only (fragile, invisible)
- Auth gate appears after first story (too late, too confusing)
- "Saved" means localStorage (misleading)
- Account creation is a form (wrong for this audience)

## What This Preserves

- Local autosave as crash protection (already partially built)
- Supabase as cloud backend (already in place)
- Magic link auth (already works — just needs new trigger points)
- Stripe/subscription tier system (untouched by this change)
