-- Migration: add therapist_reviewed_at to ai_checkins
-- Allows therapists to dismiss/verify a wellness check-in from the dashboard.
-- Once set, the check-in no longer appears on the therapist's dashboard.

ALTER TABLE ai_checkins
  ADD COLUMN IF NOT EXISTS therapist_reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- Allow the therapist to update their own patients' check-ins
CREATE POLICY IF NOT EXISTS "Therapist can review checkins"
  ON ai_checkins
  FOR UPDATE
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());
