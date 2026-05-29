-- Migration: Add is_active flag to profiles
-- Run this in Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles(is_active);

-- Admin can update any profile's is_active status
-- (Assuming admin role has full access or this is done via service role)
