# Embers Web - Project Goals & Implementation Plan

**Domain:** embersinc.org
**Hosting:** Vercel
**Target Launch:** Web MVP

---

## Vision Statement

Embers transforms the challenging task of preserving family history into an engaging, natural experience through AI-driven conversations. The web version extends this mission to reach users on any device, enabling frictionless family sharing and broader accessibility for seniors who may not have iPhones.

---

## Core Goals

### 1. Accessibility First
- **Large touch targets** (60pt minimum)
- **High contrast** text and UI elements
- **Voice-first interaction** - users can speak naturally without complex UI
- **Text labels on everything** - no icon-only buttons
- **Support for screen readers** and keyboard navigation
- **Font scaling up to 200%**

### 2. Frictionless Onboarding
- **No password required** - magic link authentication
- **Single question to start**: "What should I call you?"
- **Immediate first story** with a gentle, accessible prompt
- **Celebrate completion** - positive reinforcement after first story

### 3. Natural Conversation
- **Web Speech API** for voice input (Chrome/Edge/Safari)
- **OpenAI GPT-4** for empathetic, contextual responses
- **Text-to-Speech** for AI responses (OpenAI TTS or browser TTS)
- **Visual silence indicator** showing "Sending in 5...4...3..."
- **Memory of previous stories** for contextual follow-ups

### 4. Family Connection (The Viral Loop)
- **Simple invite flow** via SMS or shareable link
- **No app download required** - family reads stories on web
- **Notification system** when new stories are shared
- **Family members can suggest prompts**: "Ask grandma about..."
- **Comments and reactions** on stories

### 5. Tangible Output
- **PDF export** of Life Book with professional formatting
- **Audio compilation** - download all recordings
- **Print-on-demand integration** (future: Blurb, Lulu)

---

## Target User Personas

### Primary: Margaret (The Storyteller)
- 78 years old, retired teacher
- Wants to share stories with grandchildren
- Finds technology overwhelming
- Prefers speaking over typing
- Needs large text and simple navigation

### Secondary: Sarah (The Connector)
- 45 years old, Margaret's daughter
- Sets up the account for her mother
- Wants to receive notifications of new stories
- May suggest prompts for mom to answer

### Tertiary: Grandchildren (The Listeners)
- Ages 8-16
- Read and listen to grandma's stories
- Can ask follow-up questions
- Share reactions

---

## Life Book Chapters (From iOS App)

1. **Who I Am** - Personal identity, values, what makes you "you"
2. **Where I Come From** - Roots, heritage, family background
3. **What I've Loved** - Joyful memories, meaningful experiences
4. **What's Been Hard** - Challenges, resilience, lessons from difficulty
5. **What I've Learned** - Wisdom gathered from life experiences
6. **What I'm Still Figuring Out** - Ongoing questions, current explorations
7. **What I Want You to Know** - Messages to pass on to loved ones

---

## Technical Architecture

### Frontend Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for gentle animations
- **Radix UI** for accessible components

### Backend Stack
- **Supabase** for database, auth, and storage
- **OpenAI API** for GPT-4 conversations and TTS
- **Web Speech API** for speech-to-text
- **Vercel** for hosting and edge functions

### Data Models

```typescript
// User
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  preferences: {
    voiceEnabled: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
    highContrast: boolean;
  };
}

// Story
interface Story {
  id: string;
  userId: string;
  title: string;
  content: string;
  audioUrl?: string;
  chapter: ChapterType;
  tags: string[];
  createdAt: Date;
  isPublic: boolean;
  familyGroupId?: string;
}

// Family Group
interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  createdAt: Date;
}

// Family Member
interface FamilyMember {
  id: string;
  userId?: string; // null if invited but not joined
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt?: Date;
  invitedAt: Date;
}

// Conversation
interface Conversation {
  id: string;
  storyId: string;
  messages: Message[];
  createdAt: Date;
}

// Message
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
}
```

---

## Feature Phases

### Phase 1: MVP (Web Launch)
- [ ] Landing page explaining Embers
- [ ] Magic link authentication
- [ ] Simple onboarding (name only)
- [ ] Voice conversation with GPT-4
- [ ] Text fallback for typing
- [ ] Story saving to database
- [ ] Story library view
- [ ] Basic Life Book organization
- [ ] Single-user experience

### Phase 2: Family Features
- [ ] Family group creation
- [ ] Invite via link/SMS
- [ ] Story sharing with family
- [ ] Family member notifications
- [ ] Comments on stories
- [ ] Prompt suggestions from family

### Phase 3: Export & Polish
- [ ] PDF Life Book export
- [ ] Audio compilation download
- [ ] Improved story classification
- [ ] Timeline view
- [ ] Search and filtering
- [ ] Mobile-responsive refinements

### Phase 4: Growth & Monetization
- [ ] Premium tier (unlimited stories, priority AI)
- [ ] Print-on-demand integration
- [ ] Public story community (opt-in)
- [ ] Themed storytelling challenges

---

## UI/UX Principles

### Colors (Ember Theme)
```css
--ember-orange: #E86D48;      /* Primary - warm, inviting */
--ember-red: #D64545;         /* Accent */
--ember-gold: #F5A623;        /* Highlight */
--text-primary: #2C3E50;      /* Dark, readable */
--text-secondary: #7F8C8D;    /* Muted */
--background: #FFFAF5;        /* Warm white */
--surface: #FFFFFF;           /* Cards */
```

### Typography
- **Headings:** Inter or system font, 24-32px
- **Body:** 18-20px minimum for readability
- **Line height:** 1.6 for comfortable reading

### Interaction Patterns
- **One action per screen** where possible
- **Persistent "Talk to Me" button** - large, central
- **Clear visual feedback** for all actions
- **Undo available** for destructive actions
- **Auto-save** - never lose progress

---

## Success Metrics

### User Engagement
- Stories completed per session
- Average story length
- Return visits (weekly active users)
- Family invites sent and accepted

### Technical Health
- Page load time < 2 seconds
- Voice recognition accuracy
- Error rates < 1%
- Mobile usability score > 90

### Business Metrics
- Conversion rate (visitor → first story)
- Family viral coefficient
- Premium conversion rate (future)

---

## Competitive Differentiation

| Feature | Embers | StoryWorth | Memoir Apps |
|---------|--------|------------|-------------|
| Voice-first | Yes | No | Some |
| AI-guided | Yes | No | Partial |
| Free tier | Yes | No | Limited |
| Web access | Yes | Yes | Some |
| Family sharing | Built-in | Email-based | Varies |
| Senior-focused UX | Primary | Secondary | No |

---

## Risk Mitigation

### Technical Risks
- **Web Speech API browser support** → Fallback to typing, recommend Chrome
- **OpenAI API costs** → Implement rate limiting, caching
- **Audio storage costs** → Compress audio, tier limits

### User Experience Risks
- **Seniors struggle with voice** → Large text input alternative
- **Privacy concerns** → Clear data ownership messaging
- **Stories feel incomplete** → AI helps close narrative loops

---

## Next Steps

1. **Initialize Next.js project** with all dependencies
2. **Set up Supabase** database and authentication
3. **Build landing page** that explains value proposition
4. **Create conversation UI** with voice input
5. **Integrate OpenAI** for AI conversation partner
6. **Build story saving** and library view
7. **Deploy to Vercel** and connect embersinc.org
8. **User testing** with 3-5 seniors

---

*Document Version: 1.0*
*Created: December 2024*
*Project: Embers Web (embersinc.org)*
