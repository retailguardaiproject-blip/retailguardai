// Shared rules for counting alerts in case rows (used by the receiver and the summary cards).
type Row = Record<string, unknown>;
const f = (c: Row, k: string) => String(c[k] ?? '').trim();
const flagged = (v: string, none: string) => v !== '' && v.toLowerCase() !== none.toLowerCase();

export const isInventoryAlert = (c: Row) => flagged(f(c, 'Inventory Alert'), 'No variance alert');
export const isDiscountAlert = (c: Row) => flagged(f(c, 'Discount Alert (demo rule >=20%)'), 'No discount alert');
export const isReturnsAlert = (c: Row) => flagged(f(c, 'Returns Alert (synthetic demo rule >=4 units)'), 'No returns alert');
export const needsReview = (c: Row) => flagged(f(c, 'Review Priority'), 'No rule-based alert');
export const hasValidationIssue = (c: Row) => /invalid|review_data|issue|error|missing|fail/i.test(f(c, 'Data Status'));

// ---- Validation & alert classification for incoming n8n rows ----
const INT64_MAX = 9223372036854775807;
const SQLI = /(;|--|\/\*|\b(drop|delete|insert|update|alter|truncate)\s+(table|from|into)\b|\bunion\s+select\b|\bor\s+1\s*=\s*1\b|sql_inject)/i;
// Columns may arrive with or without the spreadsheet's explanatory suffix, e.g. "Source Inventory Level (meaning to verify)".
const key = (c: Row, name: string) => Object.keys(c).find((k) => k === name || k.startsWith(name + ' ('));
const val = (c: Row, name: string) => { const k = key(c, name); return k ? c[k] : undefined; };
const present = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';
const num = (v: unknown) => (typeof v === 'number' ? v : present(v) ? Number(String(v).trim()) : NaN);

export type Classified = Row & { 'Review Priority': string; 'Data Status': string; 'Evidence / Explanation': string };

export function classifyCase(input: Row): Classified {
  const c: Row = { ...input };
  const schema: string[] = [], review: string[] = [];

  // RG-NEG-ERR-04: injection attempts are blocked and the value is sanitized.
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'string' && SQLI.test(v)) {
      schema.push(`[SECURITY ALERT] SQL Injection attempt detected in payload field '${k}'. Input sanitized and blocked.`);
      c[k] = '[BLOCKED]';
    }
  }
  // RG-NEG-ERR-05: composite primary key.
  const missing = ['Store ID', 'Product ID', 'Category'].filter((k) => !present(c[k]));
  if (missing.length) schema.push(`[SCHEMA ERROR] Mandatory composite primary keys (${missing.map((m) => `'${m}'`).join(', ')}) evaluated to null or empty string. Record rejected.`);

  // RG-NEG-ERR-01 / 02: source integer fields.
  for (const [name, nonNeg] of [['Source Inventory Level', false], ['Source Units Sold', true], ['Source Discount (%)', true]] as const) {
    const raw = name === 'Source Discount (%)' ? c[name] : val(c, name);
    if (!present(raw) || String(raw) === '[BLOCKED]') continue;
    const n = num(raw);
    if (Number.isNaN(n)) schema.push(`[SCHEMA ERROR] Field '${name}' expects integer but received non-numeric string ('${String(raw).slice(0, 40)}').`);
    else if (nonNeg && n < 0) schema.push(`[SCHEMA ERROR] Negative value rejected in '${name}' (${n}).`);
    else if (Math.abs(n) > INT64_MAX) review.push(`[VALIDATION ERROR] Numeric overflow in '${name}' (exceeds 64-bit limit).`);
    else if (name === 'Source Discount (%)' && n > 100) review.push(`[VALIDATION ERROR] Discount of ${n}% violates physical 0-100% boundary limit.`);
  }
  // RG-NEG-ERR-03: stock fields used in calculations.
  for (const name of ['Synthetic Opening Stock', 'Synthetic Purchases Received', 'Synthetic Customer Returns Restocked', 'Synthetic Supplier Returns', 'Synthetic Actual Closing Stock']) {
    const raw = val(c, name);
    if (present(raw) && String(raw) !== '[BLOCKED]' && Number.isNaN(num(raw)))
      review.push(`[EXECUTION ERROR] TypeError: Cannot perform arithmetic operation on string '${String(raw).slice(0, 40)}'. Expected Closing Stock calculation returned NaN.`);
  }

  if (schema.length || review.length) {
    return { ...c, 'Review Priority': 'Review', 'Data Status': schema.length ? 'INVALID_SCHEMA' : 'REVIEW_DATA',
      'Evidence / Explanation': [...schema, ...review].join(' ') } as Classified;
  }

  // Groups 1 & 2: rule alerts. Use numbers when sent, else the alert text n8n provided.
  const variance = num(val(c, 'Inventory Variance'));
  const disc = num(c['Source Discount (%)']);
  const ret = num(val(c, 'Synthetic Customer Returns Restocked'));
  const inv = Number.isFinite(variance) ? variance !== 0 : isInventoryAlert(c);
  const dis = Number.isFinite(disc) ? disc >= 20 : isDiscountAlert(c);
  const rts = Number.isFinite(ret) ? ret >= 4 : isReturnsAlert(c);
  const vTxt = Number.isFinite(variance) ? `${variance > 0 ? '+' : ''}${variance} units` : 'variance';
  const invTxt = `Inventory ${Number.isFinite(variance) && variance > 0 ? 'Surplus' : 'Shrinkage'} Alert (${vTxt})`;
  const disTxt = `Discount Alert (${Number.isFinite(disc) ? disc.toFixed(1) + '% >= 20%' : 'flagged'})`;
  const retTxt = `Returns Alert (${Number.isFinite(ret) ? ret + ' restocked units >= 4' : 'flagged'})`;
  const n = [inv, dis, rts].filter(Boolean).length;
  const out: Row = { ...c };
  if (Number.isFinite(variance)) out['Inventory Alert'] = inv ? invTxt : 'No variance alert';
  if (Number.isFinite(disc)) out['Discount Alert (demo rule >=20%)'] = dis ? disTxt : 'No discount alert';
  if (Number.isFinite(ret)) out['Returns Alert (synthetic demo rule >=4 units)'] = rts ? retTxt : 'No returns alert';

  let msg: string | null = null, prio = String(c['Review Priority'] ?? 'No rule-based alert');
  if (inv && dis && rts) { prio = 'High review priority'; msg = `[CRITICAL ALERT] Triple Anomaly Detected: ${invTxt}, ${disTxt}, and ${retTxt}. High Priority Audit Required.`; }
  else if (inv && (dis || rts)) { prio = 'High review priority'; msg = `[ALERT] ${invTxt} combined with ${dis ? disTxt : retTxt}. High Priority Review Required.`; }
  else if (n >= 2) { prio = 'Review'; msg = `[NOTICE] ${disTxt} and ${retTxt} with no inventory variance. Medium Priority.`; }
  else if (inv) { prio = 'Review'; msg = `[NOTICE] Standalone ${invTxt.replace(' units)', ' units detected)')}. No promotional or return rule triggers. Medium Priority.`; }
  else if (dis) { prio = 'Review'; msg = `[NOTICE] Standalone ${disTxt.replace('>= 20%', '>= 20% threshold')}. Inventory variance is zero. Medium Priority.`; }
  else if (rts) { prio = 'Review'; msg = `[NOTICE] Standalone ${retTxt.replace('>= 4', '>= 4 threshold')}. No stock variance detected. Medium Priority.`; }
  else if (Number.isFinite(variance) || Number.isFinite(disc) || Number.isFinite(ret)) prio = 'No rule-based alert';

  return { ...out, 'Review Priority': prio,
    'Data Status': msg ? 'Anomalous Rule Trigger' : String(c['Data Status'] ?? 'Valid'),
    'Evidence / Explanation': msg ?? String(c['Evidence / Explanation'] ?? '') } as Classified;
}

// Data Status of a case row. Spreadsheet reference rows carry a provenance note
// ("Source fields plus clearly labelled synthetic stock movements") instead of a
// validation status; those count as Valid.
const PROVENANCE_NOTE = 'Source fields plus clearly labelled synthetic stock movements';
export const caseDataStatus = (c: Row) => {
  const s = f(c, 'Data Status');
  return !s || s === PROVENANCE_NOTE ? 'Valid' : s;
};

// First bracketed tag in the evidence text, e.g. [SCHEMA ERROR], [SECURITY ALERT], [NOTICE].
export const caseIssueType = (c: Row) => f(c, 'Evidence / Explanation').match(/^\[([^\]]+)\]/)?.[1] ?? '';

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
const unwrap = (x: unknown) => (x && typeof x === 'object' && 'json' in (x as Row) ? (x as Row)['json'] : x);

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
  const raw: unknown = o['cases'];
  const cases = Array.isArray(raw) ? (raw.map(unwrap) as Row[]) : null;
  return { summary: o, cases };
}
