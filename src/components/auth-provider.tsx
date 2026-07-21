"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { pullCloudData, setSyncUser } from "@/lib/cloud-sync";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let syncedUserId: string | null = null;

    function handleUser(nextUser: User | null) {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        setSyncUser(nextUser.id);
        if (syncedUserId !== nextUser.id) {
          syncedUserId = nextUser.id;
          void pullCloudData(nextUser.id);
        }
      } else {
        setSyncUser(null);
        syncedUserId = null;
      }
    }

    void supabase.auth.getUser().then(({ data }) => handleUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
