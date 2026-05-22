import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { auth, users } from './api';
import type { User } from './types';

const STORE_KEY = 'user';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Show cached user instantly while we verify with server
      const cached = await SecureStore.getItemAsync(STORE_KEY);
      if (cached) setUser(JSON.parse(cached));

      try {
        const me = await users.me();
        setUser(me);
        await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(me));
      } catch {
        // No valid session — clear stale cache
        setUser(null);
        await SecureStore.deleteItemAsync(STORE_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    await auth.login(email, password);
    const me = await users.me();
    setUser(me);
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(me));
  }

  async function register(username: string, email: string, password: string) {
    await auth.register(username, email, password);
    await auth.login(email, password);
    const me = await users.me();
    setUser(me);
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(me));
  }

  async function logout() {
    await auth.logout();
    setUser(null);
    await SecureStore.deleteItemAsync(STORE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
