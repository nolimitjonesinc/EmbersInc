-- Verify and enable RLS on all user-data tables
-- Run this in Supabase SQL Editor to ensure all tables are protected

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE embers_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE embers_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE embers_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for embers_users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_users' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON embers_users FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON embers_users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- RLS policies for embers_stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_stories' AND policyname = 'Users can read own stories'
  ) THEN
    CREATE POLICY "Users can read own stories"
      ON embers_stories FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_stories' AND policyname = 'Users can insert own stories'
  ) THEN
    CREATE POLICY "Users can insert own stories"
      ON embers_stories FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_stories' AND policyname = 'Users can update own stories'
  ) THEN
    CREATE POLICY "Users can update own stories"
      ON embers_stories FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_stories' AND policyname = 'Users can delete own stories'
  ) THEN
    CREATE POLICY "Users can delete own stories"
      ON embers_stories FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS policies for embers_drafts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embers_drafts' AND policyname = 'Users can manage own drafts'
  ) THEN
    CREATE POLICY "Users can manage own drafts"
      ON embers_drafts FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verify: list all tables and their RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE 'embers_%' OR tablename = 'family_groups')
ORDER BY tablename;
