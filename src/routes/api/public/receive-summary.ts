import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const count = z.number().int().min(0).max(100_000_000);
const payloadSchema = z.object({
  totalRecords: count,
  inventoryAlerts: count,
  discountAlerts: count,
  returnsAlerts: count,
  recordsRequiringReview: count,
  recordsWithValidationIssues: count,
  cases: z.array(z.record(z.string(), z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]))
    .refine((c) => typeof c['Case ID'] === 'string' || typeof c['Case ID'] === 'number', 'Case ID required')).max(5000).optional(),
});

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
        const provided = request.headers.get('x-api-key') ?? '';
        if (!secret || !safeEqual(provided, secret)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const text = await request.text();
        if (text.length > 5_000_000) return Response.json({ error: 'Payload too large' }, { status: 413 });
        let json: unknown;
        try { json = JSON.parse(text); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
        const body = Array.isArray(json) ? json[0] : json;
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: 'Invalid summary fields', issues: parsed.error.issues.map(i => i.path.join('.')) }, { status: 400 });
        const p = parsed.data;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { error } = await supabaseAdmin.from('retailguard_summary').insert({
          total_records: p.totalRecords, inventory_alerts: p.inventoryAlerts, discount_alerts: p.discountAlerts,
          returns_alerts: p.returnsAlerts, records_requiring_review: p.recordsRequiringReview,
          records_with_validation_issues: p.recordsWithValidationIssues,
          cases: p.cases ?? null,
        });
        if (error) return Response.json({ error: 'Could not store summary' }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
