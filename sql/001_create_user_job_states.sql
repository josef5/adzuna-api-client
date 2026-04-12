CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_id'),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'userId'),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'user' ->> 'id'),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'id'),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'),
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    NULLIF(current_setting('request.jwt.claim.user_id', true), ''),
    NULLIF(current_setting('request.jwt.claim.userId', true), '')
  );
$$;

CREATE TABLE IF NOT EXISTS public.user_job_states (
  user_id text NOT NULL DEFAULT public.current_user_id(),
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
  USING ((SELECT public.current_user_id()) = user_id)
  WITH CHECK ((SELECT public.current_user_id()) = user_id);
