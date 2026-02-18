# Family Prompts & Shared Memories

> Source: `Danny's idea — Feb 2026`
> Progress: 0/8 tasks done
> Sprint: TBD (after monetization setup complete)

## Why This Matters

Families are the #1 reason people preserve memories. Right now, the elderly user talks to Embers alone. But family members have questions they'd love answered and photos they want stories behind. This feature turns Embers from a solo journaling tool into a family memory machine — and it's a massive differentiator from competitors.

## The Vision

Family member logs in → sees their loved one's profile → submits a question or uploads a photo → next time the elderly user opens Embers, those prompts are waiting: "Your daughter Sarah sent you a photo and wants to hear the story behind it."

## Tasks

### Database & API
- [ ] Create `embers_family_prompts` table (family_member_id, target_user_id, type: question|photo, content, photo_url, status: pending|answered|skipped, story_id)
- [ ] API route: POST /api/family/prompts — family member submits a question or photo
- [ ] API route: GET /api/family/prompts — elderly user fetches pending prompts on conversation start
- [ ] API route: PATCH /api/family/prompts/[id] — mark prompt as answered (link to story)

### Family Member Experience
- [ ] Family dashboard page — see loved one's stories, submit prompts, upload photos
- [ ] Photo upload flow — family member uploads image with optional question ("What's happening in this photo?")

### Elderly User Experience
- [ ] Prompt queue on conversation start — "Sarah wants to know about..." shown before opening question
- [ ] Photo prompt integration — show the photo in conversation, Embers asks about it using Photo Detective analysis as context

## Dependencies

- Sprint 6 (monetization) — family sharing is a premium feature
- `embers_family_members` and `embers_family_groups` tables already exist
- Photo Detective feature already exists (can analyze uploaded photos)
- Auth system in place

## Revenue Angle

This is a premium-only feature. Families pay because:
- They get a way to actively participate in memory preservation
- The stories that come back are gold — specific, prompted, photo-triggered
- It's the difference between "Grandma has a journaling app" and "Our family is building a legacy together"
