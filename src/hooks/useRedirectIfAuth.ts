// /src/hooks/useRedirectIfAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function useRedirectIfAuth(redirectTo: string = '/dashboard') {
  const router = useRouter();
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    }
    checkAuth();
  }, [router, redirectTo]);
}
