-- Create embers_drafts table for auto-saving conversation drafts
-- Each user has at most one active draft (upsert on save)

CREATE TABLE IF NOT EXISTS public.embers_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.embers_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own drafts
CREATE POLICY "Users can view own drafts"
  ON public.embers_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON public.embers_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
  ON public.embers_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON public.embers_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_embers_drafts_user_id ON public.embers_drafts(user_id);
