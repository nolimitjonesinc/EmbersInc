# Embers Voice Experience Plan

## The Problem

The web app currently waits silently for the user to speak first. This is fundamentally wrong.

**This is NOT a "read and write" experience.**

This is a trust-building conversation between an empathetic interviewer and someone who wants to share their life stories but doesn't know how to start.

### What Great Interviewers Do

Research on therapeutic interviewing (StoryCorps, Humans of New York, oral history projects) shows:

1. **They speak first** - Breaking the ice is the interviewer's job
2. **They introduce themselves warmly** - "I'm here to listen to you"
3. **They explain what will happen** - Reduces anxiety
4. **They establish safety** - "There's no wrong answer, take your time"
5. **They model vulnerability** - Share a tiny bit to show it's safe
6. **They ask ONE question** - Simple, sensory, low-stakes
7. **They validate constantly** - "Thank you for sharing that"
8. **They use the person's words** - Shows genuine listening
9. **They pace to comfort** - Never rush, comfortable silences are OK
10. **They close with gratitude** - The person should feel honored, not drained

### Why People Share Memories

- **Legacy** - Want their stories to live beyond them
- **Connection** - Want to feel heard and understood
- **Processing** - Talking helps make sense of experiences
- **Healing** - Sharing can be cathartic
- **Gift-giving** - Stories are gifts for loved ones
- **Identity** - Telling stories helps define who we are

### What's Missing in Web App

1. ❌ No automatic voice greeting when conversation starts
2. ❌ No explanation of what this experience is
3. ❌ No establishment of safety/trust upfront
4. ❌ User has to speak first (intimidating)
5. ❌ No warm-up before diving into memories

---

## The Solution: Voice-First Experience

### Phase 1: Automatic Voice Introduction

When user taps the flame to begin, Ember should **immediately speak**:

#### New User Flow
```
[User taps flame]
[Flame animates to "speaking" state]
[Voice plays automatically]

EMBER: "Hello, and welcome. I'm Ember.

I'm here to help you capture the stories and memories that matter most to you.
There's no pressure, no right or wrong way to do this.
Just your voice, your memories, and all the time you need.

Think of me as a friend who's genuinely curious about your life.
I'll ask questions, and you share whatever comes to mind.

Let's start with something simple...

[pause]

What's a smell that instantly takes you back to a happy moment in your life?"

[Ember finishes speaking]
[Flame transitions to "listening" state]
[Speech recognition activates automatically]
```

#### Returning User Flow
```
[User taps flame]

EMBER: "Welcome back! It's good to hear from you again.

Last time, you shared some wonderful memories about [mentioned person/theme].
I'd love to hear more whenever you're ready.

What memory has been on your mind lately?"
```

### Phase 2: Conversation Flow Template

#### Opening (0-2 minutes)
- Ember speaks first
- Warm introduction
- Set expectations
- Simple opening question (sensory-based)

#### Warm-Up (2-5 minutes)
- Easy questions about senses, places, people
- Build comfort with the format
- Validate every response ("Thank you for sharing that")

#### Deepening (5-15 minutes)
- Follow threads they've introduced
- Ask about specific people they mention
- Use their words back to them
- One question at a time

#### Exploration (15-30 minutes)
- Go deeper into meaningful topics
- Ask "why" and "how did that feel" questions
- Allow comfortable silences
- Offer gentle encouragement if stuck

#### Closing (when ready)
- Recognize end signals ("thank you", "that's all")
- Summarize what was shared
- Express genuine gratitude
- Offer to save and explain what happens next

### Phase 3: Trust-Building Techniques

1. **Sensory Triggers** - Start with smells, sounds, textures (low emotional stakes)
2. **Place-Based Questions** - "Tell me about the kitchen in your childhood home"
3. **People-Based Questions** - "Who made you laugh the most growing up?"
4. **Time-Based Questions** - "What did a typical Sunday look like?"
5. **Validation Phrases**:
   - "Thank you for sharing that"
   - "That's a beautiful memory"
   - "I can tell that meant a lot to you"
   - "Take your time, I'm here"
6. **Reflection** - "It sounds like [person] was really important to you"
7. **Gentle Probing** - "What else do you remember about that moment?"

---

## Technical Implementation

### Current State (Web App)
- ✅ TTS API exists (`/api/tts`) - OpenAI + Polly fallback
- ✅ Audio playback works (`playAudio` function)
- ✅ Speech recognition works
- ✅ Silence detection works
- ❌ No auto-play greeting on conversation start
- ❌ No "Ember speaks first" logic

### Required Changes

#### 1. Auto-Play Introduction on Page Load
```typescript
// In conversation/page.tsx
useEffect(() => {
  if (mounted && messages.length === 0 && !hasPlayedIntro) {
    playIntroduction();
  }
}, [mounted]);

const playIntroduction = async () => {
  const greeting = generatePersonalizedGreeting(userName, isReturningUser);
  const openingQuestion = getOpeningQuestion(selectedInterests);

  const introMessage = `${greeting} ${openingQuestion}`;

  // Add as first message
  setMessages([{
    id: 'intro',
    role: 'assistant',
    content: introMessage,
    timestamp: new Date()
  }]);

  // Speak it
  await playAudio(introMessage);

  // Then start listening
  startListening();
};
```

#### 2. Generate Personalized Greetings
```typescript
function generatePersonalizedGreeting(userName?: string, isReturning?: boolean): string {
  if (isReturning && userName) {
    return `Welcome back, ${userName}. It's good to hear from you again.`;
  }

  const greetings = [
    `Hello${userName ? `, ${userName}` : ''}. I'm Ember.

I'm here to help you capture the stories and memories that matter most.
There's no pressure here - just your voice, your memories, and all the time you need.

Think of me as a friend who's genuinely curious about your life.`,
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}
```

#### 3. Sensory Opening Questions
```typescript
const openingQuestions = [
  "Let's start simple... What's a smell that instantly takes you back to a happy moment?",
  "Here's an easy one to begin... What sound from your childhood can you still hear perfectly in your mind?",
  "Let me ask you something gentle... If you close your eyes, what's the first place from your past that you see?",
  "To get us started... Who's someone whose laugh you can still hear?",
];
```

#### 4. State Management for Intro
```typescript
const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
const [isEmberSpeaking, setIsEmberSpeaking] = useState(false);

// Store intro played state in sessionStorage to prevent replay on refresh
useEffect(() => {
  const played = sessionStorage.getItem('embers_intro_played');
  if (played) setHasPlayedIntro(true);
}, []);
```

---

## Task List

### Immediate (Voice Introduction)
- [ ] Add `hasPlayedIntro` state to track intro playback
- [ ] Create `playIntroduction()` function that speaks greeting + question
- [ ] Auto-trigger introduction when user first lands (or taps flame)
- [ ] Add "Ember is speaking" visual state to flame
- [ ] Auto-start listening after intro finishes
- [ ] Store intro state in sessionStorage

### Greeting System
- [ ] Create `generatePersonalizedGreeting()` for new vs returning users
- [ ] Create bank of sensory-based opening questions
- [ ] Integrate with existing interest selection
- [ ] Add returning user context (mentioned people, themes)

### Conversation Flow
- [ ] Ensure Ember always responds with voice (not just text)
- [ ] Add validation phrases to AI responses
- [ ] Implement "one question at a time" rule in prompts
- [ ] Add comfortable silence handling (don't rush)

### Trust-Building
- [ ] Update system prompts to emphasize therapeutic approach
- [ ] Add memory unlocking techniques to prompts
- [ ] Implement "use their words back" in responses
- [ ] Add closing summary when conversation ends

### Testing
- [ ] Test new user flow end-to-end
- [ ] Test returning user personalization
- [ ] Test voice playback on mobile Safari
- [ ] Test silence detection timing
- [ ] Test graceful ending flow

---

## Success Metrics

1. **User speaks within 30 seconds** of intro ending
2. **Average session length > 5 minutes** (vs current drop-off)
3. **Stories saved per session > 0.8**
4. **Return rate > 40%**

---

## Example Complete Flow

```
[User opens conversation page]
[Flame is glowing gently, inviting]

[User taps flame]

[Flame brightens, enters "speaking" mode]

EMBER (voice): "Hello. I'm Ember.

I'm here to help you capture the stories and memories that matter most to you.
There's no pressure, no right or wrong answers. Just your voice, your memories,
and all the time you need.

Think of me as a friend who's genuinely curious about your life.

Let's start with something simple...

What's a smell that instantly takes you back to a happy moment?"

[Flame transitions to "listening" mode with gentle pulse]
[Silence... user thinking]

USER: "Um... I guess... fresh bread. My grandmother used to bake every Sunday."

[Flame brightens slightly, acknowledging input]

EMBER (voice): "Fresh bread... that's beautiful. Sunday baking with your grandmother.

What was it like being in her kitchen on those Sundays?"

[Flame returns to listening mode]

USER: "It was warm. She had this old wooden table where we'd sit and wait
for the bread to come out. She'd always let me have the first slice with butter..."

[Continues naturally...]
```

---

## References

- StoryCorps Interview Techniques
- Humans of New York approach to strangers
- Oral History Association best practices
- Therapeutic interviewing frameworks
- iOS Embers app implementation
