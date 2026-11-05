'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, department, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { profiles, loading, error, reload: load };
}
