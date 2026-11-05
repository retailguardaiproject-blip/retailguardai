import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Panel } from '@/components/ui-kit';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useConnectionSession } from '@/hooks/useConnection';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Access review · RetailGuard AI' },
    { name: 'description', content: 'Approve or revoke account access to RetailGuard AI investigation summaries.' },
    { property: 'og:title', content: 'Access review · RetailGuard AI' },
    { property: 'og:description', content: 'Approve or revoke account access to RetailGuard AI investigation summaries.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Admin,
});

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

function Admin() {
  const signedIn = useConnectionSession();
  const qc = useQueryClient();
  const accounts = useQuery({
    queryKey: ['admin-accounts'],
    enabled: signedIn,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_accounts');
      if (error) throw new Error(error.message.includes('Forbidden') ? 'Only admins can review access.' : 'Could not load accounts.');
      return data ?? [];
    },
  });
  const setAccess = useMutation({
    mutationFn: async (v: { id: string; approved: boolean }) => {
      const { error } = await supabase.rpc('admin_set_viewer', { _user_id: v.id, _approved: v.approved });
      if (error) throw new Error('Could not update access.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-accounts'] }),
  });

  if (!signedIn) return <Panel title="Access review"><p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary underline">Sign in</Link> as an admin to review accounts.</p></Panel>;

  const rows = accounts.data ?? [];
  const pending = rows.filter((r) => !r.is_admin && !r.is_viewer).length;

  return (
    <Panel title={`Access review${pending ? ` · ${pending} pending` : ''}`}>
      {accounts.error ? <p className="text-sm text-destructive">{accounts.error.message}</p>
        : accounts.isLoading ? <p className="text-sm text-muted-foreground">Loading accounts…</p>
        : (
        <table className="w-full text-sm">
          <thead className="label-caps text-left text-muted-foreground">
            <tr><th className="py-2">Email</th><th>Joined</th><th>Last sign-in</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-border">
                <td className="py-2">{r.email}</td>
                <td>{fmt(r.created_at)}</td>
                <td>{fmt(r.last_sign_in_at)}</td>
                <td>{r.is_admin ? <span className="text-primary">Admin</span> : r.is_viewer ? 'Approved' : <span className="text-warning">Pending</span>}</td>
                <td className="text-right">
                  {!r.is_admin && (
                    <Button size="sm" variant={r.is_viewer ? 'outline' : 'default'} disabled={setAccess.isPending}
                      onClick={() => setAccess.mutate({ id: r.user_id, approved: !r.is_viewer })}>
                      {r.is_viewer ? 'Revoke' : 'Approve'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {setAccess.error && <p className="mt-2 text-sm text-destructive">{setAccess.error.message}</p>}
    </Panel>
  );
}
