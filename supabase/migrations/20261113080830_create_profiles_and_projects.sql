/*
# Create profiles and projects tables

Plain-English summary
LUMORA needs a public-facing profile for each account (username, display name, bio, plan) and a personal workspace of editing projects that only the owner can see.

1. New Tables
- `profiles`: one row per signed-in account. Keyed by the auth user id. Holds username (unique, case-insensitive), display name, bio, avatar URL, and subscription plan (defaults to 'free').
- `projects`: editing projects owned by a user. Holds title, favourite flag, and a JSON document for timeline/editor state (empty for now).

2. Functions and triggers
- `handle_new_auth_user()`: runs after a new account is created and inserts its profile, taking the username chosen at sign-up. Falls back to a generated name if none was given.
- `is_username_available(text)`: lets the sign-up form check a username before the account is created. Returns only true/false.

3. Security
- RLS enabled on both tables.
- `profiles`: authenticated users can read and update only their own row. Updates are restricted to username, display name, bio and avatar URL, so users cannot change their own plan.
- `projects`: authenticated users can create, read, update and delete only their own projects.
- The trigger function is not callable by app users. The availability check is callable by anonymous and signed-in users and reveals nothing beyond availability.

4. Notes
- Username uniqueness is enforced case-insensitively via a unique index on lower(username).
- Each migration step is idempotent so it can be safely re-applied.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 60),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 280),
  avatar_url text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON profiles (lower(username));

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  is_favorite boolean NOT NULL DEFAULT false,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_updated_idx ON projects (user_id, updated_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url, updated_at) ON profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'username';
  display text := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), '');
BEGIN
  IF requested IS NULL OR requested !~ '^[a-zA-Z0-9_]{3,24}$' THEN
    requested := 'creator_' || substr(replace(NEW.id::text, '-', ''), 1, 10);
  END IF;

  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, requested, display);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_auth_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE OR REPLACE FUNCTION is_username_available(candidate text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT candidate ~ '^[a-zA-Z0-9_]{3,24}$'
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE lower(username) = lower(candidate)
    );
$$;

REVOKE EXECUTE ON FUNCTION is_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_username_available(text) TO anon, authenticated;
