import { createFileRoute } from '@tanstack/react-router';
import { summaryApiResponse } from '@/lib/summary-api';

export const Route = createFileRoute('/api/public/latest-summary')({
  server: {
    handlers: {
      GET: async ({ request }) => summaryApiResponse(request, process.env['N8N_SUMMARY_SECRET'], async () => {
        // This trusted service read is authorized by the shared key before loading the privileged client.
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        return await supabaseAdmin.from('retailguard_summary')
          .select('id,received_at,total_records,inventory_alerts,discount_alerts,returns_alerts,records_requiring_review,records_with_validation_issues,cases')
          .order('received_at', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle();
      }),
    },
  },
});