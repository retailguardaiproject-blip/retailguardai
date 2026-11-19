import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useConnectionSession } from '@/hooks/useConnection';
import { TRIAGE_STATUSES, validTriageStatus } from '@/lib/workspace-tools';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export function CaseWork({ caseId }: { caseId: string }) {
  const signedIn = useConnectionSession();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Open');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const work = useQuery({
    queryKey: ['case-work', signedIn, caseId], enabled: signedIn, retry: false,
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('Sign in to load notes.');
      const { data, error } = await supabase.from('case_work').select('note,status').eq('user_id', auth.user.id).eq('case_id', caseId).maybeSingle();
      if (error) throw new Error('Could not load case notes.');
      return { userId: auth.user.id, note: data?.note ?? '', status: data?.status ?? 'Open' };
    },
  });
  useEffect(() => { setNote(work.data?.note ?? ''); setStatus(work.data?.status ?? 'Open'); setMessage(''); }, [work.data, caseId]);
  if (!signedIn) return <p className="mt-4 text-sm text-muted-foreground"><Link to="/login" className="text-primary">Sign in</Link> to add case notes.</p>;
  async function save() {
    if (!work.data || !validTriageStatus(status)) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.from('case_work').upsert({ user_id: work.data.userId, case_id: caseId, note, status });
      if (error) throw new Error('Could not save notes. Approved access is required.');
      await qc.invalidateQueries({ queryKey: ['case-work'] });
      setMessage('Saved');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save notes.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 border-t border-border pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="label-caps">My case notes</h3>
      <select aria-label="Triage status" value={status} disabled={busy || work.isLoading || !!work.error} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-input bg-secondary px-2 py-1 text-sm">{TRIAGE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
    </div>
    <Textarea aria-label="Case note" placeholder="Investigation note…" maxLength={10000} value={note} disabled={busy || work.isLoading || !!work.error} onChange={(e) => setNote(e.target.value)} />
    <div className="flex items-center gap-3"><Button size="sm" disabled={busy || !work.data || !!work.error} onClick={() => void save()}><Save />{busy ? 'Saving…' : 'Save note'}</Button><p role="status" className="text-xs text-muted-foreground">{work.error?.message ?? (work.isLoading ? 'Loading notes…' : message)}</p></div>
  </div>;
}