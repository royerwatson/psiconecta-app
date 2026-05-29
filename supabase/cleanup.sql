-- Limpieza completa — ejecutar PRIMERO antes del schema.sql
DROP TABLE IF EXISTS group_session_participants CASCADE;
DROP TABLE IF EXISTS group_sessions CASCADE;
DROP TABLE IF EXISTS ai_checkins CASCADE;
DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS clinical_history CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS therapist_availability CASCADE;
DROP TABLE IF EXISTS therapist_credentials CASCADE;
DROP TABLE IF EXISTS therapist_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS update_therapist_rating();
DROP FUNCTION IF EXISTS handle_new_user();
