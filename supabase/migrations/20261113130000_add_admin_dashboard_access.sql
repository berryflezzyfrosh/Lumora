/*
  Admin access is granted only by a trusted server setting
  auth.users.raw_app_meta_data.role = 'admin'. It must never be written from
  client-side code or stored in user-editable profile metadata.
*/

DROP POLICY IF EXISTS "admin_read_profiles" ON public.profiles;
CREATE POLICY "admin_read_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_read_projects" ON public.projects;
CREATE POLICY "admin_read_projects" ON public.projects
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_projects" ON public.projects;
CREATE POLICY "admin_delete_projects" ON public.projects
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.admin_list_users(page_size integer DEFAULT 50, page_offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  username text,
  display_name text,
  plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF page_size < 1 OR page_size > 100 OR page_offset < 0 THEN
    RAISE EXCEPTION 'Invalid pagination values' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    COALESCE(p.username, ''),
    COALESCE(p.display_name, ''),
    COALESCE(p.plan, 'free')
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON p.id = u.id
  ORDER BY u.created_at DESC, u.id
  LIMIT page_size
  OFFSET page_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_users(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_profile_plan(target_profile_id uuid, target_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF target_plan NOT IN ('free', 'pro') THEN
    RAISE EXCEPTION 'Invalid plan' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET plan = target_plan, updated_at = now()
  WHERE id = target_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_profile_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_plan(uuid, text) TO authenticated;
