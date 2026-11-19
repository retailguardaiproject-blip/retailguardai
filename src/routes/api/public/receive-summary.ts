import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { classifyCase, countCases, normalizePayload } from '@/lib/case-rules';

const count = z.number().int().min(0).max(100_000_000);
const summarySchema = z.object({
  totalRecords: count,
  inventoryAlerts: count,
  discountAlerts: count,
  returnsAlerts: count,
  recordsRequiringReview: count,
  recordsWithValidationIssues: count,
});
const caseSchema = z.record(z.string().max(200), z.union([z.string().max(5000), z.number(), z.boolean(), z.null()]))
  .refine((c) => typeof c['Case ID'] === 'string' || typeof c['Case ID'] === 'number', 'Case ID required');
const casesSchema = z.array(caseSchema).max(20000);

function safeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export const Route = createFileRoute('/api/public/receive-summary')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['N8N_SUMMARY_SECRET'];
        const provided = request.headers.get('x_api_key') ?? request.headers.get('x-api-key') ?? '';
        if (!secret || !safeEqual(provided, secret)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const text = await request.text();
        if (text.length > 20_000_000) return Response.json({ error: 'Payload too large' }, { status: 413 });
        let json: unknown;
        try { json = JSON.parse(text); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

        const { summary, cases: rawCases } = normalizePayload(json);
        let cases: z.infer<typeof casesSchema> | null = null;
        if (rawCases) {
          const pc = casesSchema.safeParse(rawCases);
          if (!pc.success) return Response.json({ error: 'Invalid cases', issues: pc.error.issues.slice(0, 10).map(i => i.path.join('.')) }, { status: 400 });
          cases = pc.data.map(classifyCase) as z.infer<typeof casesSchema>;
        }
        const ps = summarySchema.safeParse(summary ?? {});
        // Prefer counts computed from delivered cases; fall back to n8n totals when no cases are sent.
        const p = cases ? countCases(cases) : ps.success ? ps.data : null;
        if (!p) return Response.json({ error: 'Send case rows or the six summary totals' }, { status: 400 });

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { error } = await supabaseAdmin.from('retailguard_summary').insert({
          total_records: p.totalRecords, inventory_alerts: p.inventoryAlerts, discount_alerts: p.discountAlerts,
          returns_alerts: p.returnsAlerts, records_requiring_review: p.recordsRequiringReview,
          records_with_validation_issues: p.recordsWithValidationIssues,
          cases: cases ?? null,
        });
        if (error) return Response.json({ error: 'Could not store summary' }, { status: 500 });
        const rejected = (cases ?? []).filter((c) => c['Data Status'] === 'INVALID_SCHEMA' || c['Data Status'] === 'REVIEW_DATA')
          .slice(0, 50).map((c) => ({ caseId: c['Case ID'], status: c['Data Status'], error: c['Evidence / Explanation'] }));
        return Response.json({ ok: true, totalRecords: p.totalRecords, casesStored: cases?.length ?? 0,
          validationIssues: p.recordsWithValidationIssues, errors: rejected });
      },
    },
  },
});
