# Documentation & Rules

> Source: `created by Claude Code architecture audit`
> Progress: 9/12 tasks done

## Tasks

### Core Documentation (Completed)
- [x] Create Emotional State Response Guide (`docs/rules/EMOTIONAL_STATE_RESPONSES.md`)
- [x] Create Persona Voice Guides with examples (`docs/rules/PERSONA_VOICE_GUIDES.md`)
- [x] Create Chapter Classification Guide (`docs/rules/CHAPTER_CLASSIFICATION_GUIDE.md`)
- [x] Extract Therapeutic Conversation Rules to standalone doc (`docs/rules/THERAPEUTIC_CONVERSATION_RULES.md`)

### Deep Research Documentation (Completed)
- [x] Create Therapeutic Psychology Foundation (`docs/rules/THERAPEUTIC_PSYCHOLOGY_FOUNDATION.md`)
  - Based on: Motivational Interviewing (OARS), Reminiscence Therapy, legendary interviewers (Oprah, Barbara Walters, Larry King, Terry Gross, Anderson Cooper, Conan O'Brien)
- [x] Create Interviewer Archetype Personas (`docs/rules/INTERVIEWER_ARCHETYPES.md`)
  - 8 distinct archetypes: Warm Witness, Gentle Excavator, Curious Companion, Intimate Explorer, Playful Friend, Grief Holder, Wise Elder, Fascinated Youth

### Ember Core Identity (Completed)
- [x] Create EMBER_CORE_IDENTITY.md (`docs/rules/EMBER_CORE_IDENTITY.md`)
  - Comprehensive document defining who Ember is, the Five Sacred Rules, emotional state responses, response formula, what Ember never does, and sample conversations
- [x] Update persona definitions to use new 8-archetype system (`src/lib/personas/definitions.ts`)
  - EMBER_CORE_IDENTITY constant with full psychological foundation
  - 9 personas: ember (default) + 8 archetypes inspired by legendary interviewers
  - New getPersonasByCategory() function for UI organization
- [x] Update chat/route.ts to use new system (removed duplicate therapeutic rules, simplified to user context only)

### Integration Work (Pending)
- [ ] Integrate EMOTIONAL_STATE_RESPONSES.md into chat API (detect emotional state, adjust response)
- [ ] Integrate CHAPTER_CLASSIFICATION_GUIDE.md into themeClassifier (add edge case handling)
- [ ] Implement archetype selection in onboarding UI (let users choose conversation style using getPersonasByCategory())
