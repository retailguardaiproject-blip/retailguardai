import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { latestSummary } from '@/lib/summary.functions';
import { useConnectionSession } from '@/hooks/useConnection';
import { Panel } from './ui-kit';

const CARDS = [
  ['total_records', 'Total records'],
  ['inventory_alerts', 'Inventory alerts'],
  ['discount_alerts', 'Discount alerts'],
  ['returns_alerts', 'Returns alerts'],
  ['records_requiring_review', 'Requiring review'],
  ['records_with_validation_issues', 'Validation issues'],
] as const;

export function LatestSummary() {
  const signedIn = useConnectionSession();
  const read = useServerFn(latestSummary);
  const q = useQuery({ queryKey: ['latest-summary', signedIn], queryFn: () => read(), enabled: signedIn, refetchInterval: 30000, retry: false });
  if (!signedIn) return (
    <Panel title="Latest n8n summary">
      <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary">Sign in</Link> to view the latest summary.</p>
    </Panel>
  );
  const row = q.data;
  return (
    <Panel title="Latest n8n summary" className="mb-4">
      {q.error ? <p role="alert" className="text-sm text-critical">Summary unavailable.</p>
        : !row ? <p className="text-sm text-muted-foreground">{q.isLoading ? 'Loading…' : 'No summary received from n8n yet.'}</p>
        : <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {CARDS.map(([k, label]) => (
              <div key={k} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-mono text-2xl">{row[k].toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Received {new Date(row.received_at).toLocaleString()}</p>
        </>}
    </Panel>
  );
}
