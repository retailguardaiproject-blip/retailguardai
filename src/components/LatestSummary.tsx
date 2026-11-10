import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { SAMPLE_CASES, deliveredCases, useLatestSummary } from '@/hooks/useDashboardData';
import { VARIANCE, type AnomalyCase } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Panel, PriorityBadge, Variance } from './ui-kit';

type Rec = Record<string, unknown>;
const field = (c: AnomalyCase, k: string) => String((c as unknown as Rec)[k] ?? '');

const CARDS = [
  { key: 'total_records', label: 'Total records', desc: 'Every record analysed in the latest run.', match: () => true, col: 'Review Priority' },
  { key: 'inventory_alerts', label: 'Inventory alerts', desc: 'Stock counts that differ from expected closing stock.', match: (c: AnomalyCase) => field(c, 'Inventory Alert') !== 'No variance alert', col: 'Inventory Alert' },
  { key: 'discount_alerts', label: 'Discount alerts', desc: 'Records with a discount of 20% or more.', match: (c: AnomalyCase) => field(c, 'Discount Alert (demo rule >=20%)') !== 'No discount alert', col: 'Discount Alert (demo rule >=20%)' },
  { key: 'returns_alerts', label: 'Returns alerts', desc: 'Records with 4 or more returned units.', match: (c: AnomalyCase) => field(c, 'Returns Alert (synthetic demo rule >=4 units)') !== 'No returns alert', col: 'Returns Alert (synthetic demo rule >=4 units)' },
  { key: 'records_requiring_review', label: 'Requiring review', desc: 'Records flagged as Review or High review priority.', match: (c: AnomalyCase) => c['Review Priority'] !== 'No rule-based alert', col: 'Review Priority' },
  { key: 'records_with_validation_issues', label: 'Validation issues', desc: 'Records that failed data validation.', match: () => false, col: 'Data Status' },
] as const;

export function LatestSummary() {
  const q = useLatestSummary();
  const signedIn = q.signedIn;
  const [active, setActive] = useState<string | null>(null);
  if (!signedIn) return (
    <Panel title="Latest n8n summary">
      <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary">Sign in</Link> to view the latest summary.</p>
    </Panel>
  );
  const row = q.data;
  const card = CARDS.find((c) => c.key === active);
  const live = deliveredCases(row);
  const rows = card ? (live ?? SAMPLE_CASES).filter(card.match) : [];
  return (
    <Panel title="Latest n8n summary" className="mb-4">
      {q.error ? <p role="alert" className="text-sm text-critical">Summary unavailable.</p>
        : !row ? <p className="text-sm text-muted-foreground">{q.isLoading ? 'Loading…' : 'No summary received from n8n yet.'}</p>
        : <>
          <div role="tablist" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {CARDS.map((c) => (
              <button key={c.key} role="tab" aria-selected={active === c.key} onClick={() => setActive(active === c.key ? null : c.key)}
                className={cn('rounded-md border p-3 text-left transition-colors hover:border-primary', active === c.key ? 'border-primary bg-primary/10' : 'border-border')}>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-mono text-2xl">{row[c.key].toLocaleString()}</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Received {new Date(row.received_at).toLocaleString()} · {live ? `${live.length} cases delivered` : 'n8n sent totals only, details show spreadsheet cases'} · click a card for details</p>
          {card && (
            <div role="tabpanel" className="mt-4 rounded-md border border-border p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">{card.label}: {row[card.key].toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground">{card.desc} Showing {rows.length} matching {live ? 'delivered' : 'reference'} cases.</p>
              </div>
              {rows.length === 0 ? <p className="text-sm text-muted-foreground">No matching cases.</p> : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                      <tr className="text-left"><th className="p-2">Case</th><th className="p-2">Date</th><th className="p-2">Store</th><th className="p-2">Product</th><th className="p-2">Category</th><th className="p-2">Variance</th><th className="p-2">Alert</th><th className="p-2">Priority</th><th className="p-2">Next check</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c['Case ID']} className="border-t border-border align-top">
                          <td className="p-2 font-mono">{c['Case ID']}</td>
                          <td className="p-2">{field(c, 'Date')}</td>
                          <td className="p-2">{c['Store ID']}</td>
                          <td className="p-2">{c['Product ID']}</td>
                          <td className="p-2">{c.Category}</td>
                          <td className="p-2"><Variance v={c[VARIANCE]} /></td>
                          <td className="p-2 text-xs">{field(c, card.col)}</td>
                          <td className="p-2"><PriorityBadge p={c['Review Priority']} /></td>
                          <td className="p-2 text-xs text-muted-foreground">{c['Recommended Next Check']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>}
    </Panel>
  );
}
