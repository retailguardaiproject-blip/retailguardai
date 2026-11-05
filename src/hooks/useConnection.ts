import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useConnectionSession() {
  const [signedIn, setSignedIn] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') qc.removeQueries({ queryKey: ['latest-summary'] });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return signedIn;
}
