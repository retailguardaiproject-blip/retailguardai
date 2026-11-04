import { endpointSchema, parseCases } from './n8n-validation';
export async function cryptToken(value: string, secret: string, userId: string, decrypt = false) {
 const key = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)), 'AES-GCM', false, ['encrypt', 'decrypt']);
 if (decrypt) {
  const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes.slice(0,12), additionalData:new TextEncoder().encode(userId)}, key, bytes.slice(12));
  return new TextDecoder().decode(plain);
 }
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const encrypted = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:new TextEncoder().encode(userId)}, key, new TextEncoder().encode(value)));
 return btoa(String.fromCharCode(...iv,...encrypted));
}
export async function requestCases(endpoint: string, header: string, token?: string) {
 endpointSchema.parse(endpoint);
 const started = Date.now();
 const response = await fetch(endpoint, {method:'GET', redirect:'error', signal:AbortSignal.timeout(15000), headers: {Accept:'application/json', ...(token ? {[header]:token} : {})}});
 if (!response.ok) { await response.body?.cancel(); throw new Error(`n8n returned HTTP ${response.status}. Check webhook activation and credentials.`); }
 const reader = response.body?.getReader(); if (!reader) throw new Error('n8n returned an empty response.');
 let body=''; let size=0; const decoder=new TextDecoder();
 while(true) { const chunk=await reader.read(); if(chunk.done) break; size+=chunk.value.byteLength; if(size>5_000_000){ await reader.cancel(); throw new Error('n8n response exceeds 5 MB.'); } body+=decoder.decode(chunk.value,{stream:true}); }
 body+=decoder.decode();
 let cases; try {cases=parseCases(JSON.parse(body));} catch {throw new Error('n8n returned invalid case JSON. Check the summary fields and review priorities.');}
 return {cases, latency:Date.now()-started};
}

export async function fetchRecordedCases(client: import('@supabase/supabase-js').SupabaseClient<import('@/integrations/supabase/types').Database>, userId: string, config: {endpoint:string;auth_header:string}, kind: 'test'|'delivery', secret: string | undefined) {
 const {safeDeliveryError}=await import('./n8n-status');
 const start=Date.now();
 try {
  const credential=await client.from('n8n_credentials').select('encrypted_token').eq('user_id',userId).maybeSingle();
  if(credential.error) throw new Error('Could not read credential.');
  if(credential.data&&!secret) throw new Error('Secure credential storage is unavailable.');
  const token=credential.data&&secret?await cryptToken(credential.data.encrypted_token,secret,userId,true):undefined;
  const result=await requestCases(config.endpoint,config.auth_header,token);
  const event=await client.from('n8n_events').insert({user_id:userId,kind,success:true,case_count:result.cases.length,latency_ms:result.latency});
  if(event.error) throw new Error('Could not record connection status.');
  return result;
 } catch(error) {
  const message=safeDeliveryError(error);
  await client.from('n8n_events').insert({user_id:userId,kind,success:false,message,latency_ms:Date.now()-start});
  throw new Error(message);
 }
}
