-- Family Prompts table
CREATE TABLE IF NOT EXISTS embers_family_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES embers_family_members(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitter_name TEXT NOT NULL,
  submitter_relationship TEXT NOT NULL,
  submitter_email TEXT,
  type TEXT NOT NULL DEFAULT 'question' CHECK (type IN ('question', 'photo')),
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'offered', 'answered', 'skipped', 'declined')),
  story_id UUID REFERENCES embers_stories(id) ON DELETE SET NULL,
  offered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversation-start queries (storyteller fetching their pending prompts)
CREATE INDEX idx_family_prompts_target_status ON embers_family_prompts(target_user_id, status);
-- Index for submission page queries
CREATE INDEX idx_family_prompts_group_created ON embers_family_prompts(family_group_id, created_at);

-- RLS
ALTER TABLE embers_family_prompts ENABLE ROW LEVEL SECURITY;

-- Storyteller can read their own prompts
CREATE POLICY "Storytellers can read their prompts"
  ON embers_family_prompts FOR SELECT
  USING (auth.uid() = target_user_id);

-- Storyteller can update their own prompts (accept/skip/decline/mark answered)
CREATE POLICY "Storytellers can update their prompts"
  ON embers_family_prompts FOR UPDATE
  USING (auth.uid() = target_user_id);

-- Anyone can insert prompts (guest submissions via API — rate limited at API layer)
CREATE POLICY "Anyone can submit prompts"
  ON embers_family_prompts FOR INSERT
  WITH CHECK (true);

-- Add prompted_by fields to embers_stories
ALTER TABLE embers_stories ADD COLUMN IF NOT EXISTS prompted_by_name TEXT;
ALTER TABLE embers_stories ADD COLUMN IF NOT EXISTS prompted_by_relationship TEXT;
ALTER TABLE embers_stories ADD COLUMN IF NOT EXISTS family_prompt_id UUID REFERENCES embers_family_prompts(id) ON DELETE SET NULL;

-- Add invite_code to family_groups if not exists (for shareable invite links)
-- Note: invite_code column already exists in the types, ensure it has a unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code) WHERE invite_code IS NOT NULL;

-- Updated_at trigger for family_prompts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_prompts_updated_at
  BEFORE UPDATE ON embers_family_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
