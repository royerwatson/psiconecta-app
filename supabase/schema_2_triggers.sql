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
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear el registro aunque falle la creación del perfil
  RAISE LOG 'handle_new_user() error for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
