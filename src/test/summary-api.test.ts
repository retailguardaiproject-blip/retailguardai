import { describe, expect, it, vi } from 'vitest';
import { summaryApiResponse } from '@/lib/summary-api';

const secret = 'test-only-shared-key';
const data = {
  id: 'summary-1', received_at: '2026-11-25T09:35:00Z', total_records: 3,
  inventory_alerts: 1, discount_alerts: 2, returns_alerts: 0,
  records_requiring_review: 2, records_with_validation_issues: 1,
  cases: [{ 'Case ID': 'C-1', 'Store ID': 'S001', 'Customer Email': 'private@example.test', note: 'private' }],
};
const request = (headers: Record<string, string> = {}) => new Request('https://example.test/api/public/latest-summary', { headers });

describe('secure latest summary API', () => {
  it.each([{}, { 'x-api-key': 'wrong' }, { 'x_api_key': 'wrong' }])('rejects missing or invalid keys before reading', async (headers) => {
    const read = vi.fn();
    expect((await summaryApiResponse(request(headers), secret, read)).status).toBe(401);
    expect(read).not.toHaveBeenCalled();
  });
  it('fails closed when no server secret is configured', async () => {
    const read = vi.fn();
    expect((await summaryApiResponse(request({ 'x-api-key': secret }), undefined, read)).status).toBe(401);
    expect(read).not.toHaveBeenCalled();
  });
  it.each(['x-api-key', 'x_api_key'])('accepts the shared secret through %s and returns stored metrics', async (header) => {
    const response = await summaryApiResponse(request({ [header]: secret }), secret, async () => ({ data, error: null }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      id: 'summary-1', receivedAt: data.received_at, totalRecords: 3, inventoryAlerts: 1,
      discountAlerts: 2, returnsAlerts: 0, recordsRequiringReview: 2, recordsWithValidationIssues: 1,
      cases: [{ 'Case ID': 'C-1', 'Store ID': 'S001' }],
    });
  });
  it('returns 404 without sample data when no delivery exists', async () => {
    expect((await summaryApiResponse(request({ 'x-api-key': secret }), secret, async () => ({ data: null, error: null }))).status).toBe(404);
  });
  it('handles aggregate-only deliveries without inventing cases', async () => {
    const response = await summaryApiResponse(request({ 'x-api-key': secret }), secret, async () => ({ data: { ...data, cases: null }, error: null }));
    expect((await response.json()).cases).toEqual([]);
  });
  it.each(['returned', 'thrown'])('returns a safe error for %s database failures', async (mode) => {
    const response = await summaryApiResponse(request({ 'x-api-key': secret }), secret, async () => {
      if (mode === 'thrown') throw new Error('private details');
      return { data: null, error: 'private details' };
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Could not read summary' });
  });
});