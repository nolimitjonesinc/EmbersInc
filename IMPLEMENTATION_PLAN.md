# Embers Web - Complete iOS Feature Parity Implementation Plan

## Overview
Implementing all iOS app functionality in the web app, plus enhancements.

---

## PR1: Interest Selection Onboarding
**Goal**: Let users select story topics during onboarding (like iOS)

### Tasks:
- [ ] Create `src/lib/services/interestService.ts` - Store/retrieve selected interests
- [ ] Create `src/data/interests.ts` - Define interest categories (Defining Moments, Living Legacy, Untold Stories)
- [ ] Update `src/app/onboarding/page.tsx` - Add interest selection step with card grid
- [ ] Create `src/components/onboarding/InterestCard.tsx` - Selectable interest cards
- [ ] Create `src/components/onboarding/CategorySection.tsx` - Category groupings
- [ ] Store interests in localStorage + prepare Supabase schema
- [ ] Use selected interests to personalize opening prompts

---

## PR2: Warm Engagement Prompts Library
**Goal**: Port the iOS curated question library for therapeutic opening questions

### Tasks:
- [ ] Create `src/lib/prompts/warmEngagementPrompts.ts` - Full library from iOS:
  - Connection prompts (scents, family dinners, childhood rooms)
  - Yearly highlights prompts
  - Emotional connection prompts
- [ ] Create `src/lib/prompts/memoryPrompts.ts` - Family, timeframe, theme prompts
- [ ] Create `src/lib/prompts/promptSelector.ts` - Smart prompt selection based on:
  - User's selected interests
  - Previously discussed themes
  - Time of day / session context
- [ ] Update chat API to use personalized opening prompts
- [ ] Add prompt variety tracking (don't repeat same prompt)

---

## PR3: User Communication Style Tracking
**Goal**: Track and adapt to user's storytelling patterns (like iOS)

### Tasks:
- [ ] Create `src/types/communicationStyle.ts` - TypeScript types:
  ```typescript
  interface UserCommunicationStyle {
    storytellingStyle: 'chronological' | 'associative' | 'detail-focused' | 'emotion-focused' | 'unknown'
    emotionalDepth: 'reserved' | 'balanced' | 'expressive' | 'unknown'
    detailLevel: 'sparse' | 'balanced' | 'detailed' | 'unknown'
    commonThemes: Record<string, number>
    frequentlyMentionedPeople: string[]
    preferredTimeframes: string[]
  }
  ```
- [ ] Create `src/lib/services/styleAnalyzer.ts` - Analyze user responses:
  - Detect storytelling patterns (chronological markers, emotional words)
  - Track detail density (word count, specificity)
  - Extract named entities (people, places, dates)
  - Identify recurring themes
- [ ] Create `src/lib/services/userStyleService.ts` - Store/retrieve style data
- [ ] Update chat API to include style context in system prompt
- [ ] Add style-adaptive response rules (like iOS activeRules)

---

## PR4: Personalized Returning User Experience
**Goal**: Different greetings and prompts for returning users

### Tasks:
- [ ] Create `src/lib/services/sessionService.ts` - Track user sessions:
  - First visit vs returning
  - Last conversation topics
  - Story count
  - Frequently mentioned people
- [ ] Create `src/lib/prompts/returningUserPrompts.ts` - Personalized greetings:
  - Reference previously mentioned people
  - Build on established themes
  - Acknowledge preferred timeframes
- [ ] Update conversation page to detect returning users
- [ ] Update chat API with returning user context
- [ ] Add "Continue where you left off" feature

---

## PR5: Family Sharing System
**Goal**: Wire up existing database schema for family invitations

### Tasks:
- [ ] Create `src/app/family/page.tsx` - Family management UI
- [ ] Create `src/app/api/family/route.ts` - Family CRUD operations
- [ ] Create `src/app/api/family/invite/route.ts` - Invitation system
- [ ] Create `src/app/api/family/join/[code]/route.ts` - Join via invite code
- [ ] Create `src/components/family/FamilyMemberCard.tsx`
- [ ] Create `src/components/family/InviteModal.tsx`
- [ ] Add family sharing toggle per story
- [ ] Add family feed view (stories from family members)
- [ ] Email notifications for invites (Resend/SendGrid)

---

## PR6: Story Editing
**Goal**: Allow users to edit saved stories

### Tasks:
- [ ] Create `src/app/stories/[id]/edit/page.tsx` - Story editor
- [ ] Update `src/app/api/stories/[id]/route.ts` - Add PUT handler
- [ ] Create `src/components/stories/NarrativeEditor.tsx` - Rich text editing
- [ ] Add edit button to story cards
- [ ] Add version history (optional)
- [ ] Regenerate narrative option
- [ ] Change chapter assignment

---

## PR7: Enhanced Therapeutic AI (Beyond iOS)
**Goal**: Improvements that make the web version even better

### Tasks:
- [ ] **Conversation Memory Across Sessions**
  - Store conversation summaries
  - Reference past stories in new sessions
  - Build relationship over time

- [ ] **Gentle Prompt System During Silence**
  - "Take your time, I'm here when you're ready"
  - "Would a different question help?"
  - Progressive encouragement

- [ ] **Emotion-Aware Responses**
  - Detect emotional moments
  - Adjust response tone dynamically
  - Offer pauses for difficult topics

- [ ] **Smart Chapter Suggestions**
  - Real-time chapter detection during conversation
  - Suggest related prompts based on emerging theme
  - Multi-chapter stories

- [ ] **Story Enrichment Suggestions**
  - After saving, suggest follow-up questions
  - "Would you like to add more about [mentioned person]?"
  - Connect related stories

- [ ] **Accessibility Enhancements**
  - Larger touch targets
  - Screen reader optimizations
  - Voice-only mode (no visual distractions)

---

## Implementation Order

1. **PR2: Warm Engagement Prompts** - Foundation for all personalization
2. **PR1: Interest Selection Onboarding** - Uses prompts library
3. **PR3: Communication Style Tracking** - Builds on conversation data
4. **PR4: Returning User Experience** - Uses style + session data
5. **PR6: Story Editing** - Independent, high value
6. **PR5: Family Sharing** - Complex, needs auth
7. **PR7: Enhanced AI** - Ongoing improvements

---

## Files to Create/Modify

### New Files:
```
src/lib/prompts/warmEngagementPrompts.ts
src/lib/prompts/memoryPrompts.ts
src/lib/prompts/promptSelector.ts
src/lib/prompts/returningUserPrompts.ts
src/lib/services/interestService.ts
src/lib/services/styleAnalyzer.ts
src/lib/services/userStyleService.ts
src/lib/services/sessionService.ts
src/data/interests.ts
src/types/communicationStyle.ts
src/components/onboarding/InterestCard.tsx
src/components/onboarding/CategorySection.tsx
src/app/family/page.tsx
src/app/api/family/route.ts
src/app/api/family/invite/route.ts
src/app/stories/[id]/edit/page.tsx
src/components/stories/NarrativeEditor.tsx
src/components/family/FamilyMemberCard.tsx
src/components/family/InviteModal.tsx
```

### Modified Files:
```
src/app/onboarding/page.tsx
src/app/conversation/page.tsx
src/app/api/chat/route.ts
src/app/api/stories/[id]/route.ts
src/lib/personas/definitions.ts
src/types/index.ts
```

---

## Database Schema Updates

### Add to users table:
```sql
ALTER TABLE users ADD COLUMN communication_style JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN selected_interests TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN session_data JSONB DEFAULT '{}';
```

### Already exists (family tables):
- family_groups
- family_members

---

## Success Metrics
- [ ] New users complete interest selection before first conversation
- [ ] Opening prompts are personalized to selected interests
- [ ] Returning users see personalized greetings referencing past conversations
- [ ] AI adapts questioning style based on detected user patterns
- [ ] Users can edit saved stories
- [ ] Family members can share and view each other's stories
