CREATE TABLE public.n8n_settings (user_id uuid PRIMARY KEY, endpoint text NOT NULL, enabled boolean NOT NULL DEFAULT false, auth_header text NOT NULL DEFAULT 'x-api-key', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_settings TO authenticated;
GRANT ALL ON public.n8n_settings TO service_role;
ALTER TABLE public.n8n_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own settings" ON public.n8n_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.n8n_credentials (user_id uuid PRIMARY KEY, encrypted_token text NOT NULL);
GRANT ALL ON public.n8n_credentials TO service_role;
ALTER TABLE public.n8n_credentials ENABLE ROW LEVEL SECURITY;