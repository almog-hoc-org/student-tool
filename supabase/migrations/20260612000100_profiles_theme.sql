-- Phase 2: Persist theme preference per user (cross-device)

ALTER TABLE public.profiles
  ADD COLUMN theme TEXT
    CHECK (theme IN ('light', 'dark', 'system'))
    DEFAULT 'system';
