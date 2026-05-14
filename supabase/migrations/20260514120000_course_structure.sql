-- Phase 2: Course / module / lesson structure.
-- Establishes the learning-portal data model on top of the existing user/auth tables.

-- 1. Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read published courses"
  ON public.courses FOR SELECT TO authenticated
  USING (is_published = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Modules
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, slug)
);

CREATE INDEX idx_modules_course_order ON public.modules(course_id, order_index);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Module read follows course visibility"
  ON public.modules FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id AND (c.is_published = TRUE OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_md TEXT,                       -- markdown content
  video_url TEXT,
  transcript TEXT,                    -- searchable text — feeds the RAG embedder
  attachments JSONB,                  -- [{ name, url, type }]
  linked_tool TEXT,                   -- 'budget' | 'mortgage' | 'business_plan' | null
  estimated_minutes INT,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);

CREATE INDEX idx_lessons_module_order ON public.lessons(module_id, order_index);
CREATE INDEX idx_lessons_linked_tool ON public.lessons(linked_tool) WHERE linked_tool IS NOT NULL;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lesson read follows course visibility"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.is_published = TRUE
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Lesson progress (per-user-per-lesson)
CREATE TYPE public.lesson_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status public.lesson_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_position_seconds INT NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id, status);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
  ON public.lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress"
  ON public.lesson_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  cohort TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_cohort ON public.enrollments(cohort) WHERE cohort IS NOT NULL;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Auto-enroll on approve: when status changes to 'approved', enroll in all published courses
CREATE OR REPLACE FUNCTION public.auto_enroll_on_approve() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO enrollments (user_id, course_id)
    SELECT NEW.user_id, c.id
    FROM courses c
    WHERE c.is_published = TRUE
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_enroll_on_approve
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_on_approve();

-- 7. RPC: progress summary per user
CREATE OR REPLACE FUNCTION public.user_course_progress(_user_id UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  total_lessons INT,
  completed_lessons INT,
  in_progress_lessons INT,
  last_activity TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS course_id,
    c.title AS course_title,
    (SELECT COUNT(*)::INT FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id AND l.is_published) AS total_lessons,
    (SELECT COUNT(*)::INT FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id AND lp.user_id = _user_id AND lp.status = 'completed') AS completed_lessons,
    (SELECT COUNT(*)::INT FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id AND lp.user_id = _user_id AND lp.status = 'in_progress') AS in_progress_lessons,
    (SELECT MAX(lp.updated_at) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id AND lp.user_id = _user_id) AS last_activity
  FROM courses c
  JOIN enrollments e ON e.course_id = c.id
  WHERE e.user_id = _user_id
    AND (auth.uid() = _user_id OR public.has_role(auth.uid(), 'admin'));
$$;
