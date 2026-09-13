import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/** Tracks the current Cloud auth session in the browser. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data: current }) => {
      setSession(current.session);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const user: User | null = session?.user ?? null;

  return {
    session,
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  };
}
