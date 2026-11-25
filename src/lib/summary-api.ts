import type { Database } from '@/integrations/supabase/types';

type Summary = Database['public']['Tables']['retailguard_summary']['Row'];
type ReadSummary = () => Promise<{ data: Summary | null; error: unknown }>;

function keyMatches(provided: string, secret: string) {
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(secret);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

// Project only report fields, never arbitrary customer/account fields or private notes.
const reportFields = new Set([
  'Case ID', 'Date', 'Store ID', 'Product ID', 'Category', 'Region',
  'Expected Closing Stock', 'Inventory Variance (actual - expected)',
  'Inventory Alert', 'Discount Alert (demo rule >=20%)',
  'Returns Alert (synthetic demo rule >=4 units)', 'Review Priority',
  'Data Status', 'Evidence / Explanation', 'Recommended Next Check',
  'Source Inventory Level', 'Source Inventory Level (meaning to verify)',
  'Source Units Sold', 'Source Discount (%)', 'Synthetic Opening Stock',
  'Synthetic Purchases Received', 'Synthetic Customer Returns Restocked',
  'Synthetic Supplier Returns', 'Synthetic Actual Closing Stock',
]);

export async function summaryApiResponse(request: Request, secret: string | undefined, read: ReadSummary) {
  const respond = (body: unknown, status = 200) => Response.json(body, {
    status, headers: { 'Cache-Control': 'no-store', 'Vary': 'x-api-key, x_api_key' },
  });
  const provided = request.headers.get('x_api_key') ?? request.headers.get('x-api-key') ?? '';
  if (!secret || !provided || !keyMatches(provided, secret)) return respond({ error: 'Unauthorized' }, 401);
  try {
    const { data, error } = await read();
    if (error) return respond({ error: 'Could not read summary' }, 500);
    if (!data) return respond({ error: 'No summary has been received yet' }, 404);
    const cases = Array.isArray(data.cases) ? data.cases.flatMap((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
      return [Object.fromEntries(Object.entries(row).filter(([field]) => reportFields.has(field)))];
    }) : [];
    return respond({
      id: data.id, receivedAt: data.received_at,
      totalRecords: data.total_records, inventoryAlerts: data.inventory_alerts,
      discountAlerts: data.discount_alerts, returnsAlerts: data.returns_alerts,
      recordsRequiringReview: data.records_requiring_review,
      recordsWithValidationIssues: data.records_with_validation_issues, cases,
    });
  } catch {
    return respond({ error: 'Could not read summary' }, 500);
  }
}