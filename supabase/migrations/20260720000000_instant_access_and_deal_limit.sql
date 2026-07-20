-- כניסה מיידית + תקרת שמורות פר-משתמש
--
-- 1. ביטול הצורך באישור מנהל: נרשם חדש נכנס מיד אחרי אימות המייל.
--    יכולת החסימה (rejected) של האדמין נשמרת.
-- 2. תקרת 10 שמורות לכל משתמש בכל כלי (עסקאות/תקציב/משכנתא) — אכיפה
--    בשרת, עם הודעת שגיאה בעברית שמוצגת ישירות ב-toast של הלקוח.
-- 3. אינדקס usage_events לפי משתמש (עמוד הפעילות באדמין, קנה מידה 500+).

-- ---------------------------------------------------------------------------
-- 1. הרשמה = מאושר מיד + הודעת ברוך-הבא (הטריגר הקיים יורה רק על UPDATE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name, avatar_url, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''),
    'approved'
  );
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'student');

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.id,
    'welcome',
    'ברוך הבא לקורס! 🎉',
    'החשבון שלך מוכן. התחל מהגדרת יעד או דלג ישר למחשבון התקציב.',
    '/onboarding',
    jsonb_build_object('signed_up_at', now())
  );

  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'approved';

-- אישור כל הממתינים הקיימים — trg_notify_on_approval ישלח להם welcome
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 2. תקרת 10 שמורות פר (משתמש, כלי)
CREATE OR REPLACE FUNCTION public.enforce_snapshot_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  SELECT count(*) INTO _count
  FROM calculation_snapshots
  WHERE user_id = NEW.user_id AND tool_key = NEW.tool_key;

  IF _count >= 10 THEN
    RAISE EXCEPTION 'הגעת למגבלת 10 שמורות — מחק שמורה ישנה כדי לשמור חדשה';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_snapshot_limit ON public.calculation_snapshots;
CREATE TRIGGER trg_enforce_snapshot_limit
  BEFORE INSERT ON public.calculation_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_snapshot_limit();

-- ---------------------------------------------------------------------------
-- 3. אינדקס פעילות פר-משתמש
CREATE INDEX IF NOT EXISTS idx_usage_events_user
  ON public.usage_events (user_id, created_at DESC);
