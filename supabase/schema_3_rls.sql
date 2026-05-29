ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_credentials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_checkins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "tp_select" ON therapist_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tp_insert" ON therapist_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_update" ON therapist_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tc_select" ON therapist_credentials FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "tc_insert" ON therapist_credentials FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_select" ON therapist_availability FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ta_all"    ON therapist_availability FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "sessions_select" ON sessions FOR SELECT
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

CREATE POLICY "ch_select" ON clinical_history FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "ch_insert" ON clinical_history FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = therapist_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "mood_select" ON mood_logs FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "mood_insert" ON mood_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "checkin_select" ON ai_checkins FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "checkin_insert" ON ai_checkins FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "gs_select" ON group_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gs_all"    ON group_sessions FOR ALL   USING (auth.uid() = therapist_id);

CREATE POLICY "gsp_select" ON group_session_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gsp_insert" ON group_session_participants FOR INSERT WITH CHECK (auth.uid() = patient_id);
