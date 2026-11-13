/*
  Preserve a creator-friendly display name and username for OAuth providers
  such as Google. Provider metadata is untrusted user input, so it is only
  normalized into the existing profile field constraints.
*/

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'username';
  provider_name text := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    ''
  );
  email_name text := split_part(COALESCE(NEW.email, ''), '@', 1);
  display text;
BEGIN
  display := left(provider_name, 60);

  IF requested IS NULL OR requested !~ '^[a-zA-Z0-9_]{3,24}$' THEN
    requested := left(
      regexp_replace(lower(COALESCE(NULLIF(provider_name, ''), email_name)), '[^a-z0-9_]', '', 'g'),
      24
    );
  END IF;

  IF requested IS NULL OR char_length(requested) < 3 THEN
    requested := 'creator_' || substr(replace(NEW.id::text, '-', ''), 1, 10);
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(requested)) THEN
    requested := 'creator_' || substr(replace(NEW.id::text, '-', ''), 1, 10);
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, requested, display);

  RETURN NEW;
END;
$$;
