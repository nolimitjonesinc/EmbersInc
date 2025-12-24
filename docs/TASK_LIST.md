# Embers Web - Development Task List

## Phase 1: Foundation (MVP)

### 1.1 Project Setup
- [x] Create project directory
- [x] Create goals and documentation
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Configure Tailwind CSS with Ember theme
- [ ] Set up ESLint and Prettier
- [ ] Create folder structure
- [ ] Initialize Git repository

### 1.2 Authentication & Database
- [ ] Create Supabase project
- [ ] Set up database schema (users, stories, conversations)
- [ ] Implement magic link authentication
- [ ] Create auth context and hooks
- [ ] Build login/signup UI
- [ ] Add session persistence

### 1.3 Landing Page
- [ ] Design hero section with value proposition
- [ ] Create "How it Works" section
- [ ] Build testimonial/example section
- [ ] Add call-to-action buttons
- [ ] Responsive design for all devices
- [ ] Optimize for SEO

### 1.4 Onboarding Flow
- [ ] Welcome screen with friendly greeting
- [ ] Name collection (single input)
- [ ] Brief explanation of how voice works
- [ ] First prompt selection (easy, accessible prompts)
- [ ] Onboarding completion tracking

### 1.5 Voice Conversation System
- [ ] Implement Web Speech API for speech-to-text
- [ ] Create microphone permission flow
- [ ] Build voice recording UI with waveform
- [ ] Add silence detection (5-second auto-send)
- [ ] Create visual countdown indicator
- [ ] Implement pause/resume functionality
- [ ] Build text input fallback
- [ ] Add "I'm listening" visual feedback

### 1.6 AI Integration
- [ ] Set up OpenAI API route (server-side)
- [ ] Create conversation system prompt (from iOS app)
- [ ] Implement context management (last 10 messages)
- [ ] Add text-to-speech for AI responses
- [ ] Create gentle follow-up question generation
- [ ] Implement error handling and retries

### 1.7 Story Management
- [ ] Create story saving API endpoint
- [ ] Build story library view
- [ ] Implement story card component
- [ ] Add story detail view
- [ ] Create story editing capability
- [ ] Implement story deletion (soft delete)

### 1.8 Life Book View
- [ ] Create chapter grid layout
- [ ] Build chapter card component with progress
- [ ] Implement chapter detail view
- [ ] Add story-to-chapter assignment
- [ ] Create reading mode for stories

### 1.9 UI Components
- [ ] Button component (large, accessible)
- [ ] Input component (large text)
- [ ] Card component
- [ ] Modal/Dialog component
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error states
- [ ] Navigation header
- [ ] Footer

### 1.10 Deployment
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Connect GitHub repository
- [ ] Add custom domain (embersinc.org)
- [ ] Configure SSL
- [ ] Test production deployment

---

## Phase 2: Family Features

### 2.1 Family Groups
- [ ] Create family group database schema
- [ ] Build family creation UI
- [ ] Implement family settings

### 2.2 Invitations
- [ ] Create invite link generation
- [ ] Build invite acceptance flow
- [ ] Add SMS invite option (Twilio)
- [ ] Email invite templates

### 2.3 Sharing
- [ ] Story visibility settings
- [ ] Family feed view
- [ ] New story notifications
- [ ] Read receipts

### 2.4 Collaboration
- [ ] Comments on stories
- [ ] Reactions (hearts, etc.)
- [ ] Prompt suggestions from family
- [ ] Follow-up questions

---

## Phase 3: Export & Polish

### 3.1 Exports
- [ ] PDF Life Book generation
- [ ] Audio compilation
- [ ] Data export (JSON)

### 3.2 Polish
- [ ] Advanced story classification
- [ ] Timeline visualization
- [ ] Search functionality
- [ ] Filter by chapter/date
- [ ] Performance optimization

---

## DNS Configuration (GoDaddy → Vercel)

### Records to Add:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

### Verification:
- [ ] Add A record for root domain
- [ ] Add CNAME for www subdomain
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify in Vercel dashboard
- [ ] Test https://embersinc.org

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://embersinc.org
```

---

## File Structure

```
embers-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/
│   │   ├── conversation/
│   │   ├── stories/
│   │   ├── life-book/
│   │   └── profile/
│   ├── api/
│   │   ├── chat/
│   │   ├── stories/
│   │   └── tts/
│   ├── layout.tsx
│   └── page.tsx (landing)
├── components/
│   ├── ui/
│   ├── conversation/
│   ├── stories/
│   └── life-book/
├── lib/
│   ├── supabase/
│   ├── openai/
│   ├── speech/
│   └── utils/
├── hooks/
├── types/
├── styles/
└── public/
```

---

## Priority Order for Development

1. **Project initialization** - Get Next.js running
2. **Landing page** - Have something to show
3. **Supabase setup** - Database and auth foundation
4. **Authentication** - Magic link login
5. **Conversation UI** - Core voice experience
6. **OpenAI integration** - AI conversation partner
7. **Story saving** - Persist conversations
8. **Story library** - View saved stories
9. **Life Book** - Organize by chapter
10. **Deploy** - Go live on embersinc.org

---

*Last Updated: December 2024*
