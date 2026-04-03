"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types";

interface AuthContext {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthCtx = createContext<AuthContext>({} as AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (stored) setToken(stored);
  }, []);

  const setAuth = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("access_token", t);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("access_token");
  };

  return (
    <AuthCtx.Provider value={{ user, token, setAuth, clearAuth, isAuthenticated: !!token }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
