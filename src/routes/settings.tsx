import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Panel } from '@/components/ui-kit';
import { Button } from '@/components/ui/button';
import { Save, PlugZap, Unplug, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useConnectionSession } from '@/hooks/useConnection';
import { readConnection, saveConnection, testConnection, disconnectConnection } from '@/lib/n8n.functions';
import { connectionSchema } from '@/lib/n8n-validation';

export const Route = createFileRoute('/settings')({head:()=>({meta:[
 {title:'Connection Settings · RetailGuard AI'}, {name:'description',content:'Secure n8n endpoint settings and live case summary connection tests.'},
 {property:'og:title',content:'Connection Settings · RetailGuard AI'}, {property:'og:description',content:'Secure n8n endpoint settings and live case summary connection tests.'},
 {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'}
]}),component:SettingsPage});
const inputClass='w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';
function SettingsPage(){
 const signedIn=useConnectionSession(); const qc=useQueryClient();
 const read=useServerFn(readConnection), save=useServerFn(saveConnection), test=useServerFn(testConnection), disconnect=useServerFn(disconnectConnection);
 const config=useQuery({queryKey:['n8n-connection',signedIn],queryFn:()=>read(),enabled:signedIn,retry:false});
 const [endpoint,setEndpoint]=useState(''),[header,setHeader]=useState<'x-api-key'|'Authorization'>('x-api-key'),[token,setToken]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[success,setSuccess]=useState(false);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false);
 useEffect(()=>{ if(config.data?.settings){setEndpoint(config.data.settings.endpoint);setHeader(config.data.settings.auth_header==='Authorization'?'Authorization':'x-api-key');} },[config.data]);
 async function act(task:()=>Promise<string>){setBusy(true);setMessage('');setSuccess(false);try{setMessage(await task());setSuccess(true);await qc.invalidateQueries({queryKey:['n8n-connection']});await qc.invalidateQueries({queryKey:['n8n-summary']});}catch(e){setMessage(e instanceof Error?e.message:'Request failed.');}finally{setBusy(false);}}
 return <div className="max-w-2xl space-y-5">
 <div><h1 className="text-2xl font-semibold">Connection settings</h1><p className="mt-1 text-sm text-muted-foreground">n8n case summaries</p></div>
 {!signedIn?<Panel title="Sign in to manage connections">
 <form className="space-y-3" onSubmit={e=>{e.preventDefault();void act(async()=>{const result=signup?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/settings'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;return signup?'Check your email to confirm your account.':'Signed in.';});}}>
 <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass}/></label>
 <label className="block text-sm">Password<input type="password" required minLength={8} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} className={inputClass}/></label>
 <div className="flex gap-2"><Button disabled={busy}>{signup?'Create account':'Sign in'}</Button><Button type="button" variant="ghost" onClick={()=>setSignup(!signup)}>{signup?'Already have an account':'Create account'}</Button></div>
 </form>
 <div className="mt-4 flex flex-wrap gap-2">{(['google','lovable'] as const).map(provider=><Button key={provider} variant="outline" disabled={busy} onClick={()=>void act(async()=>{const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin+'/settings'});if(result.error)throw result.error;return 'Sign-in opened.';})}>Continue with {provider==='google'?'Google':'Lovable'}</Button>)}</div>
 </Panel>:<Panel title="n8n endpoint" action={<ShieldCheck className="h-4 w-4 text-primary"/>}>
 {config.isLoading?<p>Loading connection…</p>:config.error?<p className="text-critical">Could not load settings. Try again.</p>:<form className="space-y-4" onSubmit={e=>{e.preventDefault();void act(async()=>{const data=connectionSchema.parse({endpoint,authHeader:header,token:token||undefined});await save({data});setToken('');return 'Settings saved. Test and connect to enable live summaries.';});}}>
 <label className="block space-y-1 text-sm"><span>Production webhook URL</span><input type="url" aria-label="Production webhook URL" required maxLength={2048} className={inputClass} placeholder="https://your-instance.app.n8n.cloud/webhook/case-summary" value={endpoint} onChange={e=>setEndpoint(e.target.value)}/></label>
 <label className="block space-y-1 text-sm"><span>Authentication header</span><select className={inputClass} value={header} onChange={e=>setHeader(e.target.value==='Authorization'?'Authorization':'x-api-key')}><option value="x-api-key">x-api-key</option><option value="Authorization">Authorization</option></select></label>
 <label className="block space-y-1 text-sm"><span>Header value (optional)</span><input type="password" autoComplete="off" maxLength={4096} className={inputClass} value={token} onChange={e=>setToken(e.target.value)} placeholder={config.data?.hasCredential?'Credential saved — leave blank to keep it':'Enter the webhook header value'}/></label>
 <div className="flex flex-wrap gap-2"><Button disabled={busy}><Save/>Save settings</Button><Button type="button" variant="outline" disabled={busy||!config.data?.settings||endpoint!==config.data.settings.endpoint||header!==config.data.settings.auth_header||!!token} onClick={()=>void act(async()=>{const result=await test({data:{activate:true}});if(!result.ok)throw new Error(result.message);return `Connected · ${result.count} valid cases · ${result.latency} ms`;})}><PlugZap/>{busy?'Connecting…':'Test & connect'}</Button>
 <Button type="button" variant="ghost" disabled={busy||!config.data?.settings} onClick={()=>void act(async()=>{await disconnect();setEndpoint('');setToken('');return 'Disconnected. Dashboard is using spreadsheet samples.';})}><Unplug/>Disconnect</Button></div>
 <p className="text-sm text-muted-foreground">{config.data?.settings?.enabled?'Live connection enabled':'Sample data active'}</p>
 </form>}
 <Button className="mt-4" size="sm" variant="ghost" onClick={()=>void supabase.auth.signOut()}>Sign out</Button>
 </Panel>}
 {message&&<p role="status" className={success?'text-success text-sm':'text-critical text-sm'}>{message}</p>}
 </div>;
}
