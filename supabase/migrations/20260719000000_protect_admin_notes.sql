-- הגנה אמיתית על admin_notes ברמת העמודה.
-- עד עכשיו ה-RLS על profiles החזיר לתלמיד את השורה המלאה שלו — כולל
-- admin_notes — כי הלקוח עשה select('*'). הלקוח תוקן לרשימת עמודות
-- מפורשת, והמיגרציה הזו סוגרת גם את הצד של מסד הנתונים: שוללים SELECT
-- עמודתי על admin_notes מ-authenticated ומשאירים גישה דרך ה-RPCים
-- הקיימים (SECURITY DEFINER) וה-view profiles_self.
--
-- ⚠️ דורש deploy: supabase db push (לא ניתן להריץ מסביבת הפיתוח הזו).

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id,
  user_id,
  display_name,
  avatar_url,
  status,
  theme,
  created_at,
  updated_at,
  onboarded_at
) ON public.profiles TO authenticated;

-- RPC לקריאת ההערות עבור אדמינים (הכתיבה כבר עוברת דרך admin_set_notes)
CREATE OR REPLACE FUNCTION public.admin_get_notes(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notes TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT admin_notes INTO _notes FROM profiles WHERE user_id = _user_id;
  RETURN _notes;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_notes(UUID) FROM anon;
