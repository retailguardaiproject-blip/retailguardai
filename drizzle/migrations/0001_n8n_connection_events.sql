CREATE TABLE public.n8n_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL CHECK (kind IN ('delivery','test')), success boolean NOT NULL, case_count integer, latency_ms integer, message text, occurred_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.n8n_events TO authenticated;
GRANT ALL ON public.n8n_events TO service_role;
ALTER TABLE public.n8n_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own connection events" ON public.n8n_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX n8n_events_user_time ON public.n8n_events(user_id, occurred_at DESC);