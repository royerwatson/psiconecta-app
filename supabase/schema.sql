-- =============================================
-- PSICONECTA — Schema completo de Supabase
-- Ejecutar en: Supabase > SQL Editor > New query
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLAS
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('therapist', 'client')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  specialty           TEXT,
  bio                 TEXT,
  license_number      TEXT,
  price_per_session   NUMERIC DEFAULT 0,
  rating              NUMERIC DEFAULT 0,
  review_count        INT DEFAULT 0,
  verified            BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  available_urgent    BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_credentials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_url  TEXT NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week   INT CHECK (day_of_week BETWEEN 1 AND 7),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  UNIQUE (therapist_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id    UUID REFERENCES profiles(id),
  patient_id      UUID REFERENCES profiles(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration        INT DEFAULT 60,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  price           NUMERIC DEFAULT 0,
  is_urgent       BOOLEAN DEFAULT FALSE,
  video_room_url  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID REFERENCES sessions(id),
  therapist_id    UUID REFERENCES profiles(id),
  patient_id      UUID REFERENCES profiles(id),
  diagnosis       TEXT,
  treatment_plan  TEXT,
  session_notes   TEXT,
  risk_level      TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id),
  patient_id    UUID REFERENCES profiles(id),
  session_id    UUID REFERENCES sessions(id),
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  completed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID REFERENCES profiles(id),
  receiver_id  UUID REFERENCES profiles(id),
  content      TEXT NOT NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID REFERENCES sessions(id),
  therapist_id  UUID REFERENCES profiles(id),
  patient_id    UUID REFERENCES profiles(id),
  rating        INT CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, patient_id)
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES profiles(id),
  mood_score  INT CHECK (mood_score BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_checkins (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID REFERENCES profiles(id),
  therapist_id      UUID REFERENCES profiles(id),
  questions_answers TEXT,
  risk_level        TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_message        TEXT,
  notified          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id     UUID REFERENCES profiles(id),
  title            TEXT NOT NULL,
  description      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration         INT DEFAULT 60,
  max_participants INT DEFAULT 10,
  price            NUMERIC DEFAULT 0,
  video_room_url   TEXT,
  status           TEXT DEFAULT 'scheduled',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_session_participants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_session_id UUID REFERENCES group_sessions(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES profiles(id),
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_session_id, patient_id)
);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_therapist_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE therapist_profiles
  SET
    rating       = (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.therapist_id = NEW.therapist_id),
    review_count = (SELECT COUNT(*) FROM reviews r WHERE r.therapist_id = NEW.therapist_id)
  WHERE user_id = NEW.therapist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_therapist_rating();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

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

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- therapist_profiles
CREATE POLICY "tp_select" ON therapist_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tp_insert" ON therapist_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_update" ON therapist_profiles FOR UPDATE USING (auth.uid() = user_id);

-- therapist_credentials
CREATE POLICY "tc_select" ON therapist_credentials FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "tc_insert" ON therapist_credentials FOR INSERT WITH CHECK (auth.uid() = therapist_id);

-- therapist_availability
CREATE POLICY "ta_select" ON therapist_availability FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ta_all"    ON therapist_availability FOR ALL   USING (auth.uid() = therapist_id);

-- sessions
CREATE POLICY "sessions_select" ON sessions FOR SELECT
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

-- clinical_history
CREATE POLICY "ch_select" ON clinical_history FOR SELECT
  USING (
    auth.uid() = patient_id OR
    auth.uid() = therapist_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'therapist')
  );
CREATE POLICY "ch_insert" ON clinical_history FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);

-- tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

-- messages
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- reviews
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- mood_logs
CREATE POLICY "mood_select" ON mood_logs FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.patient_id = mood_logs.patient_id
        AND s.therapist_id = auth.uid()
    )
  );
CREATE POLICY "mood_insert" ON mood_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- ai_checkins
CREATE POLICY "checkin_select" ON ai_checkins FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "checkin_insert" ON ai_checkins FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- group_sessions
CREATE POLICY "gs_select" ON group_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gs_all"    ON group_sessions FOR ALL   USING (auth.uid() = therapist_id);

-- group_session_participants
CREATE POLICY "gsp_select" ON group_session_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gsp_insert" ON group_session_participants FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('credentials', 'credentials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_select"   ON storage.objects FOR SELECT USING (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sessions_therapist    ON sessions(therapist_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_patient       ON sessions(patient_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_messages_conv          ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mood_patient           ON mood_logs(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_checkins_patient       ON ai_checkins(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clinical_patient       ON clinical_history(patient_id, created_at);
