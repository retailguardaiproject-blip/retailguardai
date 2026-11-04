import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const latestSummary = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('retailguard_summary').select('*').order('received_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Could not read summary.');
  return data;
});
