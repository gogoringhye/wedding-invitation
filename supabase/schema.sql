CREATE TABLE IF NOT EXISTS guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 20),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.guestbook
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION update_guestbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name
    OR NEW.message IS DISTINCT FROM OLD.message THEN
    NEW.updated_at = NOW();
  ELSE
    NEW.updated_at = OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guestbook_updated_at ON guestbook;
CREATE TRIGGER guestbook_updated_at
BEFORE UPDATE ON guestbook
FOR EACH ROW
EXECUTE FUNCTION update_guestbook_updated_at();

DROP POLICY IF EXISTS guestbook_public_read ON public.guestbook;
CREATE POLICY guestbook_public_read
ON public.guestbook
FOR SELECT
TO anon, authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS guestbook_admin_read ON public.guestbook;
CREATE POLICY guestbook_admin_read
ON public.guestbook
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS guestbook_admin_delete ON public.guestbook;
REVOKE DELETE ON TABLE public.guestbook FROM anon, authenticated;

REVOKE ALL ON TABLE public.guestbook FROM anon, authenticated;
GRANT SELECT (id, name, message, created_at, updated_at, deleted_at)
ON TABLE public.guestbook TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.guestbook_create(
  p_name TEXT,
  p_message TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_id UUID;
BEGIN
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION '이름은 1자 이상 20자 이하여야 합니다.' USING ERRCODE = '22023';
  END IF;
  IF p_message IS NULL OR char_length(btrim(p_message)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION '메시지는 1자 이상 200자 이하여야 합니다.' USING ERRCODE = '22023';
  END IF;
  IF p_password IS NULL OR p_password !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION '비밀번호는 4~6자리 숫자여야 합니다.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.guestbook (name, message, password_hash)
  VALUES (
    btrim(p_name),
    btrim(p_message),
    extensions.crypt(p_password, extensions.gen_salt('bf'))
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.guestbook_create(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guestbook_create(TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.guestbook_update(
  p_id UUID,
  p_password TEXT,
  p_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION '수정할 방명록을 찾을 수 없습니다.' USING ERRCODE = '22023';
  END IF;
  IF p_password IS NULL OR p_password !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION '비밀번호는 4~6자리 숫자여야 합니다.' USING ERRCODE = '22023';
  END IF;
  IF p_message IS NULL OR char_length(btrim(p_message)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION '메시지는 1자 이상 200자 이하여야 합니다.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.guestbook
  SET message = btrim(p_message)
  WHERE id = p_id
    AND deleted_at IS NULL
    AND password_hash = extensions.crypt(p_password, password_hash);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.guestbook_update(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guestbook_update(UUID, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.guestbook_admin_delete(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.guestbook
  SET deleted_at = NOW()
  WHERE id = p_id
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.guestbook_admin_delete(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guestbook_admin_delete(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.guestbook_admin_restore(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.guestbook
  SET deleted_at = NULL
  WHERE id = p_id
    AND deleted_at IS NOT NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.guestbook_admin_restore(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guestbook_admin_restore(UUID) TO authenticated;
