export type ConnectionEvent = { id: string; kind: string; success: boolean; case_count: number | null; latency_ms: number | null; message: string | null; occurred_at: string };
export function safeDeliveryError(error: unknown): string {
 const text = error instanceof Error ? error.message : '';
 const status = /^n8n returned HTTP (\d{3})\./.exec(text)?.[1];
 if(status) return `n8n returned HTTP ${status}. Check webhook activation and credentials.`;
 if(text === 'n8n returned invalid case JSON. Check the summary fields and review priorities.') return text;
 if(text === 'n8n response exceeds 5 MB.' || text === 'n8n returned an empty response.') return text;
 if(error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) return 'n8n request timed out. Try again later.';
 return 'Connection failed. Check your webhook, credentials, and response format.';
}
export function summarizeEvents(events: ConnectionEvent[]) {
 const ordered = [...events].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at));
 return {lastDelivery:ordered.find(e=>e.kind==='delivery'&&e.success)??null,tests:ordered.filter(e=>e.kind==='test').slice(0,5),errors:ordered.filter(e=>e.kind==='delivery'&&!e.success).slice(0,5)};
}
