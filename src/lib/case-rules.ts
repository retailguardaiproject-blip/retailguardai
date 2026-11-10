// Shared rules for counting alerts in case rows (used by the receiver and the summary cards).
type Row = Record<string, unknown>;
const f = (c: Row, k: string) => String(c[k] ?? '').trim();
const flagged = (v: string, none: string) => v !== '' && v.toLowerCase() !== none.toLowerCase();

export const isInventoryAlert = (c: Row) => flagged(f(c, 'Inventory Alert'), 'No variance alert');
export const isDiscountAlert = (c: Row) => flagged(f(c, 'Discount Alert (demo rule >=20%)'), 'No discount alert');
export const isReturnsAlert = (c: Row) => flagged(f(c, 'Returns Alert (synthetic demo rule >=4 units)'), 'No returns alert');
export const needsReview = (c: Row) => flagged(f(c, 'Review Priority'), 'No rule-based alert');
export const hasValidationIssue = (c: Row) => /invalid|issue|error|missing|fail/i.test(f(c, 'Data Status'));

export function countCases(cases: Row[]) {
  return {
    totalRecords: cases.length,
    inventoryAlerts: cases.filter(isInventoryAlert).length,
    discountAlerts: cases.filter(isDiscountAlert).length,
    returnsAlerts: cases.filter(isReturnsAlert).length,
    recordsRequiringReview: cases.filter(needsReview).length,
    recordsWithValidationIssues: cases.filter(hasValidationIssue).length,
  };
}

const isCase = (x: unknown): x is Row => !!x && typeof x === 'object' && !Array.isArray(x) && 'Case ID' in (x as Row);
const unwrap = (x: unknown) => (x && typeof x === 'object' && 'json' in (x as Row) ? (x as Row).json : x);

// Accepts: an array of cases, an array of n8n items ({json: case}), {cases: [...]}, or a summary object (with optional cases).
export function normalizePayload(input: unknown): { summary: Row | null; cases: Row[] | null } {
  if (Array.isArray(input)) {
    const items = input.map(unwrap);
    if (items.length && items.every(isCase)) return { summary: null, cases: items as Row[] };
    const first = items[0];
    return normalizePayload(first);
  }
  const obj = unwrap(input);
  if (!obj || typeof obj !== 'object') return { summary: null, cases: null };
  const o = obj as Row;
  if (isCase(o)) return { summary: null, cases: [o] };
  const cases = Array.isArray(o.cases) ? (o.cases.map(unwrap) as Row[]) : null;
  return { summary: o, cases };
}
