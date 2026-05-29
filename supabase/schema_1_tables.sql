CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('therapist', 'client')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
  verification_status TEXT DEFAULT 'pending',
  available_urgent    BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_credentials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_url  TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week   INT,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id    UUID REFERENCES profiles(id),
  patient_id      UUID REFERENCES profiles(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration        INT DEFAULT 60,
  status          TEXT DEFAULT 'scheduled',
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
  risk_level      TEXT DEFAULT 'low',
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
  rating        INT,
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES profiles(id),
  mood_score  INT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_checkins (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID REFERENCES profiles(id),
  therapist_id      UUID REFERENCES profiles(id),
  questions_answers TEXT,
  risk_level        TEXT DEFAULT 'low',
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
