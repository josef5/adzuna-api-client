CREATE TABLE IF NOT EXISTS public.user_job_states (
  user_id text NOT NULL DEFAULT auth.user_id(),
  job_id text NOT NULL,
  bucket text NOT NULL CHECK (bucket IN ('saved', 'applied', 'archived')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

ALTER TABLE public.user_job_states ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_job_states TO authenticated;

DROP POLICY IF EXISTS "manage own job states" ON public.user_job_states;

CREATE POLICY "manage own job states"
  ON public.user_job_states
  FOR ALL
  TO authenticated
  USING ((SELECT auth.user_id()) = user_id)
  WITH CHECK ((SELECT auth.user_id()) = user_id);
