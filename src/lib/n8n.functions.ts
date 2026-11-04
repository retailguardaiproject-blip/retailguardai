import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { connectionSchema } from './n8n-validation';
import { z } from 'zod';

export const readConnection = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
 const {data,error}=await context.supabase.from('n8n_settings').select('endpoint,enabled,auth_header').eq('user_id',context.userId).maybeSingle();
 if(error) throw new Error('Could not read connection settings.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const credential=await supabaseAdmin.from('n8n_credentials').select('user_id').eq('user_id',context.userId).maybeSingle();
 return {settings:data, hasCredential:!!credential.data};
});
export const saveConnection = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input => connectionSchema.parse(input)).handler(async ({data,context}) => {
 const existing=await context.supabase.from('n8n_settings').select('endpoint').eq('user_id',context.userId).maybeSingle();
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 if(existing.data?.endpoint !== data.endpoint) await supabaseAdmin.from('n8n_credentials').delete().eq('user_id',context.userId);
 if(data.token) {
  const secret=process.env['N8N_CREDENTIAL_ENCRYPTION_KEY']; if(!secret) throw new Error('Secure credential storage is not configured.');
  const {cryptToken}=await import('./n8n.server');
  const result=await supabaseAdmin.from('n8n_credentials').upsert({user_id:context.userId,encrypted_token:await cryptToken(data.token,secret,context.userId)});
  if(result.error) throw new Error('Could not save credential.');
 }
 const result=await context.supabase.from('n8n_settings').upsert({user_id:context.userId,endpoint:data.endpoint,auth_header:data.authHeader,enabled:false,updated_at:new Date().toISOString()});
 if(result.error) throw new Error('Could not save connection.');
 return {saved:true};
});
export const testConnection = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input => z.object({activate:z.boolean()}).parse(input)).handler(async ({data,context}) => {
 const config=await context.supabase.from('n8n_settings').select('*').eq('user_id',context.userId).maybeSingle();
 if(!config.data) throw new Error('Save an endpoint first.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const credential=await supabaseAdmin.from('n8n_credentials').select('encrypted_token').eq('user_id',context.userId).maybeSingle();
 const {cryptToken,requestCases}=await import('./n8n.server');
 const secret=process.env['N8N_CREDENTIAL_ENCRYPTION_KEY'];
 if(credential.data && !secret) throw new Error('Secure credential storage is unavailable.');
 const token=credential.data && secret ? await cryptToken(credential.data.encrypted_token,secret,context.userId,true) : undefined;
 try {
  const result=await requestCases(config.data.endpoint,config.data.auth_header,token);
  if(data.activate) { const update=await context.supabase.from('n8n_settings').update({enabled:true}).eq('user_id',context.userId); if(update.error) throw new Error('Could not activate connection.'); }
  return {ok:true as const,count:result.cases.length,latency:result.latency};
 } catch(error) {return {ok:false as const,message: error instanceof Error && error.message.startsWith('n8n ') ? error.message : 'Connection failed. Check your webhook, credentials, and response format.'};}
});
export const liveSummary = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
 const config=await context.supabase.from('n8n_settings').select('*').eq('user_id',context.userId).maybeSingle();
 if(!config.data?.enabled) return {live:false as const,cases:[]};
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const credential=await supabaseAdmin.from('n8n_credentials').select('encrypted_token').eq('user_id',context.userId).maybeSingle();
 const secret=process.env['N8N_CREDENTIAL_ENCRYPTION_KEY'];
 if(credential.data && !secret) throw new Error('Secure credential storage is unavailable.');
 const {cryptToken,requestCases}=await import('./n8n.server');
 const token=credential.data && secret ? await cryptToken(credential.data.encrypted_token,secret,context.userId,true) : undefined;
 const result=await requestCases(config.data.endpoint,config.data.auth_header,token);
 return {live:true as const,cases:result.cases};
});
export const disconnectConnection = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 await supabaseAdmin.from('n8n_credentials').delete().eq('user_id',context.userId);
 const result=await context.supabase.from('n8n_settings').delete().eq('user_id',context.userId);
 if(result.error) throw new Error('Could not disconnect.'); return {ok:true};
});
