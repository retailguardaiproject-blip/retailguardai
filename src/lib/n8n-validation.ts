import { z } from 'zod';

export const endpointSchema = z.string().trim().max(2048).url().refine((value) => {
  const u = new URL(value);
  return u.protocol === 'https:' && u.hostname.endsWith('.app.n8n.cloud') && !u.port && !u.username && !u.password && !u.search && !u.hash && u.pathname.startsWith('/webhook/');
}, 'Use an HTTPS production webhook on your n8n Cloud instance (*.app.n8n.cloud/webhook/…).');
export const connectionSchema = z.object({ endpoint: endpointSchema, authHeader: z.enum(['x-api-key', 'Authorization']), token: z.string().max(4096).refine(v => !/[\r\n]/.test(v), 'Invalid header value').optional() });
const number = z.coerce.number().finite();
const caseSchema = z.object({
  'Case ID': z.string().min(1).max(120), 'Store ID': z.string().min(1).max(120), 'Product ID': z.string().min(1).max(120), Category: z.string().min(1).max(120),
  'Expected Closing Stock': number, 'Synthetic Actual Closing Stock': number, 'Inventory Variance (actual - expected)': number,
  'Review Priority': z.enum(['High review priority', 'Review', 'No rule-based alert']), 'Evidence / Explanation': z.string().max(20000), 'Recommended Next Check': z.string().max(20000),
});
export function parseCases(value: unknown) {
  const wrapper = z.object({ cases: z.unknown().optional(), data: z.unknown().optional() });
  const payload = Array.isArray(value) ? value : (() => { const w = wrapper.parse(value); return w.cases ?? w.data; })();
  if (!Array.isArray(payload)) throw new Error('Expected an array of cases, or an object with cases/data.');
  return z.array(caseSchema).max(10000).parse(payload.map(row => typeof row === 'object' && row !== null ? { ...row, 'Expected Closing Stock': row['Expected Closing Stock'] ?? row['Expected Closing Stock (calculated)'] } : row));
}
