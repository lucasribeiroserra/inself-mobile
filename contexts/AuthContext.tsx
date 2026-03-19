import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiFetch, getStoredToken, setStoredToken, isApiConfigured } from "@/lib/api";
import { getCheckinCount } from "@/lib/badges";

export type User = {
  id: string;
  email?: string;
  avatar_url?: string | null;
  user_metadata?: { full_name?: string; name?: string };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  checkinCount: number;
  refreshCheckinCount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name?: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  checkinCount: 0,
  refreshCheckinCount: async () => {},
  refreshUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinCount, setCheckinCount] = useState(0);

  const refreshCheckinCount = useCallback(async () => {
    const count = await getCheckinCount();
    setCheckinCount(count);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isApiConfigured()) return;
    const token = await getStoredToken();
    if (!token) return;
    const { data } = await apiFetch<{ user: { id: string; email?: string; full_name?: string; avatar_url?: string | null } }>("/auth/me");
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        avatar_url: data.user.avatar_url ?? undefined,
        user_metadata: { full_name: data.user.full_name },
      });
      await refreshCheckinCount();
    } else {
      await setStoredToken(null);
      setUser(null);
    }
  }, [refreshCheckinCount]);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (cancelled || !token) {
        setLoading(false);
        return;
      }
      const { data } = await apiFetch<{ user: { id: string; email?: string; full_name?: string; avatar_url?: string | null } }>("/auth/me");
      if (cancelled) return;
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          avatar_url: data.user.avatar_url ?? undefined,
          user_metadata: { full_name: data.user.full_name },
        });
        await refreshCheckinCount();
      } else {
        await setStoredToken(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refreshCheckinCount]);

  useEffect(() => {
    if (user) refreshCheckinCount();
  }, [user, refreshCheckinCount]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isApiConfigured()) {
        setUser({
          id: "demo-user",
          email: email || "demo@inself.app",
          user_metadata: { full_name: (email || "demo").split("@")[0] },
        });
        await refreshCheckinCount();
        return;
      }
      setLoading(true);
      const { data, error } = await apiFetch<{ user: { id: string; email?: string; full_name?: string }; token: string }>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      setLoading(false);
      if (error || !data?.token) throw new Error(error ?? "Falha no login");
      await setStoredToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        avatar_url: (data as { user?: { avatar_url?: string | null } }).user?.avatar_url ?? undefined,
        user_metadata: { full_name: data.user.full_name },
      });
      await refreshCheckinCount();
    },
    [refreshCheckinCount]
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      if (!isApiConfigured()) throw new Error("Login com Google não disponível sem API.");
      setLoading(true);
      const { data, error } = await apiFetch<{
        user: { id: string; email?: string; full_name?: string; avatar_url?: string | null };
        token: string;
      }>("/auth/google", {
        method: "POST",
        body: { id_token: idToken },
      });
      setLoading(false);
      if (error || !data?.token) throw new Error(error ?? "Falha no login com Google");
      await setStoredToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        avatar_url: data.user.avatar_url ?? undefined,
        user_metadata: { full_name: data.user.full_name },
      });
      await refreshCheckinCount();
    },
    [refreshCheckinCount]
  );

  const signUp = useCallback(
    async (email: string, password: string, full_name?: string) => {
      if (!isApiConfigured()) {
        setUser({
          id: "demo-user",
          email,
          user_metadata: { full_name: full_name || email.split("@")[0] },
        });
        await refreshCheckinCount();
        return;
      }
      setLoading(true);
      const { data, error } = await apiFetch<{ user: { id: string; email?: string; full_name?: string }; token: string }>("/auth/register", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password, full_name: full_name?.trim() || null },
      });
      setLoading(false);
      if (error || !data?.token) throw new Error(error ?? "Falha no cadastro");
      await setStoredToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        avatar_url: (data as { user?: { avatar_url?: string | null } }).user?.avatar_url ?? undefined,
        user_metadata: { full_name: data.user.full_name },
      });
      await refreshCheckinCount();
    },
    [refreshCheckinCount]
  );

  const signOut = useCallback(async () => {
    if (isApiConfigured()) await setStoredToken(null);
    setUser(null);
    setCheckinCount(0);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        checkinCount,
        refreshCheckinCount,
        refreshUser,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
