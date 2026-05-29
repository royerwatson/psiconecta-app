-- Migration: Therapist blocked dates table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS therapist_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (therapist_id, blocked_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS therapist_blocked_dates_therapist_idx
  ON therapist_blocked_dates(therapist_id, blocked_date);

-- RLS
ALTER TABLE therapist_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Therapist can manage their own blocked dates
CREATE POLICY "therapist_manage_own_blocked_dates"
  ON therapist_blocked_dates
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Patients can read blocked dates to know when NOT to book
CREATE POLICY "patients_read_blocked_dates"
  ON therapist_blocked_dates
  FOR SELECT
  USING (TRUE);
