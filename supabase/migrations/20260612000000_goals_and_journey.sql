-- Phase 2: Goals (target apartment) + journey milestones for "הדרך לדירה"

-- 1. goals — one active goal per user (use UPSERT on user_id)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_price NUMERIC,
  target_area TEXT,
  target_date DATE,
  monthly_saving NUMERIC,
  notes TEXT,
  schema_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goal"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all goals"
  ON public.goals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. journey_progress — one row per (user, milestone)
CREATE TABLE public.journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  milestone_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_key)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journey"
  ON public.journey_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all journey"
  ON public.journey_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_journey_progress_updated_at
  BEFORE UPDATE ON public.journey_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_journey_progress_user ON public.journey_progress (user_id);
