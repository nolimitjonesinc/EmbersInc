# Voice-First UX

> Source: `created by Claude Code session`
> Progress: 4/9 tasks done

## Overview

Embers should be fully voice-activated with tapping buttons only as backup.
Ember acts as a persistent conversational guide throughout the app.

## Tasks

### Onboarding (Completed)
- [x] Redesign onboarding as voice-first conversational flow
  - Ember speaks first, user responds (voice or tap)
  - No interests selection (use sensible defaults)
  - No login required (save locally first)
  - Warm introduction explaining what Embers is
- [x] Add persona/style selection step to onboarding
  - 4 simplified archetype cards (warm friend, curious listener, wise grandparent, default)
  - Saves choice to localStorage as `embers_preferred_persona`
  - Conversation page reads preference and sends to chat API
  - Inserted between name-confirm and ready phases

### Local Storage (Completed)
- [x] Enable story saving without authentication
  - Removed /conversation from protected routes
  - Stories save to localStorage when not logged in
  - User sees note about signing in for cloud backup

### Authentication (Pending)
- [ ] Implement phone + SMS authentication (replace email magic links)
  - Elderly users struggle with email/magic link flow
  - Phone number + SMS code is more familiar
  - Only prompt when user wants to backup/share

### Conversation Page (In Progress)
- [x] Auto-start voice intro when coming from onboarding
  - Set sessionStorage flag when user says "let's go"
  - Conversation page detects flag and auto-plays Ember's intro
  - No longer requires tapping flame after onboarding completes
- [ ] Voice-activate the conversation page (remaining work)
  - Apply same voice-first pattern as onboarding
  - Ember guides the storytelling session
  - Prompts should be spoken, not just displayed

### Other Pages (Pending)
- [ ] Voice-activate Life Book page
- [ ] Voice-activate Stories page
- [ ] Voice-activate Profile page
- [ ] Voice-activate Timeline page

## Notes

- Browser autoplay restriction requires user tap before audio can play
- Current workaround: "Tap Ember to begin" feels natural, not like a hurdle
- Stories save locally by default, no account needed
- useVoiceCommands hook provides speech recognition
- /api/tts endpoint provides text-to-speech via OpenAI
