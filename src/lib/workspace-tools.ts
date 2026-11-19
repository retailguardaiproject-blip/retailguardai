import type { AnomalyCase } from './types';

export const TRIAGE_STATUSES = ['Open', 'Investigating', 'Resolved'] as const;
export function validTriageStatus(value: string): boolean {
  return TRIAGE_STATUSES.some((status) => status === value);
}
export function casesCsv(rows: AnomalyCase[]): string {
  const columns: (keyof AnomalyCase)[] = ['Case ID', 'Store ID', 'Product ID', 'Category', 'Inventory Variance (actual - expected)', 'Review Priority', 'Evidence / Explanation', 'Recommended Next Check'];
  const escape = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [columns.map(escape).join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\r\n');
}
export function exportCases(rows: AnomalyCase[]) {
  const url = URL.createObjectURL(new Blob([casesCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'retailguard-cases.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}