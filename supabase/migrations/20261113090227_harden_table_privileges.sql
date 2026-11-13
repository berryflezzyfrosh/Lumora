/*
# Harden table privileges for profiles and projects

Plain-English summary
Table-level permissions were broader than the row and column rules the earlier migration intended. Signed-in users could change their own subscription plan, and the anonymous role held full read and write permissions on both tables. This migration narrows every permission to what the app actually uses.

1. Security changes
- Anonymous visitors lose all privileges on `profiles` and `projects`.
- Signed-in users can no longer insert or delete profile rows directly. Profiles are created by the sign-up trigger and removed when the account is deleted.
- Signed-in users can update only username, display name, bio, avatar and updated time on their profile. The plan column is no longer writable.
- Signed-in users can insert and update only the project columns the app edits (title, document, favourite flag, updated time). The owner column can no longer be set by the client.
- Project documents are limited to 2 MB so one project cannot store an unbounded payload.

2. Notes
- Every statement is safe to re-run.
- Row-level policies are unchanged; they still limit each user to their own rows.
*/

REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON projects FROM anon;

REVOKE INSERT, UPDATE, DELETE ON profiles FROM authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url, updated_at) ON profiles TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON projects FROM authenticated;
GRANT INSERT (title, document) ON projects TO authenticated;
GRANT UPDATE (title, document, is_favorite, updated_at) ON projects TO authenticated;
GRANT DELETE ON projects TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_document_size_limit' AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_document_size_limit CHECK (octet_length(document::text) <= 2000000);
  END IF;
END $$;
