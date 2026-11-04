import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { RefreshCw, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { readDeliveryStatus } from '@/lib/n8n.functions';
import { useConnectionSession } from '@/hooks/useConnection';
import { Panel } from './ui-kit';
import { Button } from './ui/button';
import type { ConnectionEvent } from '@/lib/n8n-status';
const time=(date:string)=>new Date(date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
function Events({events,empty}:{events:ConnectionEvent[];empty:string}){
 return events.length?<ul className="space-y-3">{events.map(e=><li key={e.id} className="flex gap-2 text-xs">
 {e.success?<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success"/>:<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-critical"/>}
 <div className="min-w-0"><p className={e.success?'text-success':'text-critical'}>{e.success?`Passed · ${e.case_count ?? 0} cases · ${e.latency_ms ?? 0} ms`:e.message}</p><time className="text-muted-foreground" dateTime={e.occurred_at}>{time(e.occurred_at)}</time></div>
 </li>)}</ul>:<p className="text-xs text-muted-foreground">{empty}</p>;
}
export function DeliveryStatus(){
 const signedIn=useConnectionSession();const read=useServerFn(readDeliveryStatus);
 const q=useQuery({queryKey:['n8n-delivery-status',signedIn],queryFn:()=>read(),enabled:signedIn,refetchInterval:15000,retry:false});
 const last=q.data?.lastDelivery;
 return <Panel title="n8n delivery status" className="mb-4" action={<Button variant="ghost" size="icon" aria-label="Refresh delivery status" title="Refresh delivery status" disabled={!signedIn||q.isFetching} onClick={()=>void q.refetch()}><RefreshCw className={q.isFetching?'animate-spin':''}/></Button>}>
 {!signedIn?<p className="text-sm text-muted-foreground"><Link to="/settings" className="text-primary">Sign in</Link> to view your connection history.</p>:q.isLoading?<p className="text-sm text-muted-foreground">Loading status…</p>:q.error?<p role="alert" className="text-sm text-critical">Delivery history unavailable. Try refreshing.</p>:<div className="grid gap-5 md:grid-cols-3">
 <div><h3 className="mb-3 text-sm font-medium">Last successful delivery</h3>{last?<><p className="flex gap-2 text-sm text-success"><Activity className="h-4 w-4"/>{last.case_count} cases received</p><time className="mt-1 block text-xs text-muted-foreground" dateTime={last.occurred_at}>{time(last.occurred_at)}</time><p className="mt-1 text-xs text-muted-foreground">{last.latency_ms} ms · fetched from n8n</p></>:<p className="text-xs text-muted-foreground">No successful deliveries yet.</p>}</div>
 <div><h3 className="mb-3 text-sm font-medium">Recent connection tests</h3><Events events={q.data?.tests??[]} empty="No connection tests yet."/></div>
 <div><h3 className="mb-3 text-sm font-medium">Recent delivery errors</h3><Events events={q.data?.errors??[]} empty="No delivery errors recorded."/></div>
 </div>}
 </Panel>;
}
