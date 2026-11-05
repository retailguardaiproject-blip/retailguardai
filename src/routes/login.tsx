import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui-kit';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useConnectionSession } from '@/hooks/useConnection';

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [
    { title: 'Sign in · RetailGuard AI' },
    { name: 'description', content: 'Sign in to view the latest RetailGuard AI investigation summary.' },
    { property: 'og:title', content: 'Sign in · RetailGuard AI' },
    { property: 'og:description', content: 'Sign in to view the latest RetailGuard AI investigation summary.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Login,
});

const inputClass = 'mt-1 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';

function Login() {
  const signedIn = useConnectionSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (signedIn) void navigate({ to: '/' }); }, [signedIn, navigate]);

  async function act(task: () => Promise<string>) {
    setBusy(true); setMessage('');
    try { setMessage(await task()); } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed.'); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-md">
      <Panel title="Sign in">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void act(async () => {
          const r = signup
            ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
            : await supabase.auth.signInWithPassword({ email, password });
          if (r.error) throw r.error;
          return signup ? 'Check your email to confirm your account.' : 'Signed in.';
        }); }}>
          <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></label>
          <label className="block text-sm">Password<input type="password" required minLength={8} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} /></label>
          <div className="flex gap-2">
            <Button disabled={busy}>{signup ? 'Create account' : 'Sign in'}</Button>
            <Button type="button" variant="ghost" onClick={() => setSignup(!signup)}>{signup ? 'Already have an account' : 'Create account'}</Button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['google', 'lovable'] as const).map((p) => (
            <Button key={p} variant="outline" disabled={busy} onClick={() => void act(async () => {
              const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
              if (r.error) throw r.error;
              return 'Sign-in opened.';
            })}>Continue with {p === 'google' ? 'Google' : 'Lovable'}</Button>
          ))}
        </div>
        {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </Panel>
    </div>
  );
}
