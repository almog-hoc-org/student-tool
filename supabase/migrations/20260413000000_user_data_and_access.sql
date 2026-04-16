-- Phase 1: User data, access control, analytics

-- 1. user_status enum + add to profiles
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE public.profiles ADD COLUMN status public.user_status NOT NULL DEFAULT 'pending';

-- 2. user_data table — per-user calculator storage
CREATE TABLE public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_key)
);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data"
  ON public.user_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all user data"
  ON public.user_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. invite_codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  cohort TEXT,
  max_uses INT DEFAULT 50,
  used_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. usage_events table — analytics
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_key TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'save',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all events"
  ON public.usage_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin RLS on profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin RLS on user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update handle_new_user() to support invite codes + status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite_code TEXT;
  _status user_status := 'pending';
BEGIN
  _invite_code := NEW.raw_user_meta_data ->> 'invite_code';

  IF _invite_code IS NOT NULL AND _invite_code != '' THEN
    UPDATE invite_codes
    SET used_count = used_count + 1
    WHERE code = _invite_code
      AND used_count < max_uses
      AND (expires_at IS NULL OR expires_at > now());
    IF FOUND THEN
      _status := 'approved';
    END IF;
  END IF;

  INSERT INTO profiles (user_id, display_name, avatar_url, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''),
    _status
  );
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- 8. Admin functions (SECURITY DEFINER)

-- List all users with email
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status user_status,
  roles app_role[],
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::TEXT,
    p.display_name,
    p.avatar_url,
    p.status,
    COALESCE(ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
    p.created_at,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY p.user_id, u.email, p.display_name, p.avatar_url, p.status, p.created_at, u.last_sign_in_at
  ORDER BY p.created_at DESC
$$;

-- Update user status
CREATE OR REPLACE FUNCTION public.admin_update_user_status(_user_id UUID, _status user_status)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET status = _status WHERE user_id = _user_id;
END;
$$;

-- Toggle admin role
CREATE OR REPLACE FUNCTION public.admin_toggle_role(_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role) THEN
    DELETE FROM user_roles WHERE user_id = _user_id AND role = _role;
  ELSE
    INSERT INTO user_roles (user_id, role) VALUES (_user_id, _role);
  END IF;
END;
$$;
