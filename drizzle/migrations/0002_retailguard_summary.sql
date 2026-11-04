CREATE TABLE public.retailguard_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_records integer NOT NULL DEFAULT 0,
  inventory_alerts integer NOT NULL DEFAULT 0,
  discount_alerts integer NOT NULL DEFAULT 0,
  returns_alerts integer NOT NULL DEFAULT 0,
  records_requiring_review integer NOT NULL DEFAULT 0,
  records_with_validation_issues integer NOT NULL DEFAULT 0,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.retailguard_summary TO authenticated;
GRANT ALL ON public.retailguard_summary TO service_role;
ALTER TABLE public.retailguard_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read summaries" ON public.retailguard_summary FOR SELECT TO authenticated USING (true);
CREATE INDEX retailguard_summary_received_idx ON public.retailguard_summary (received_at DESC);