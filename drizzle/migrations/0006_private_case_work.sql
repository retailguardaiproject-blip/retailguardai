CREATE TABLE public.case_work (user_id uuid NOT NULL, case_id text NOT NULL, note text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'Open', PRIMARY KEY (user_id, case_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_work TO authenticated;
GRANT ALL ON public.case_work TO service_role;
ALTER TABLE public.case_work ENABLE ROW LEVEL SECURITY;
CREATE POLICY case_work_owner ON public.case_work FOR ALL TO authenticated USING ((auth.uid() = user_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'viewer'::public.app_role))) WITH CHECK ((auth.uid() = user_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'viewer'::public.app_role)));
ALTER TABLE public.case_work ADD CONSTRAINT valid_work_status CHECK (status IN ('Open', 'Investigating', 'Resolved'));
ALTER TABLE public.case_work ADD CONSTRAINT valid_note_length CHECK (length(note) <= 10000);