'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AgeGroup } from '@/types';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  age_group: AgeGroup;
  church_name: string;
  created_at: string;
}

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (data: { name: string; email: string; password: string; age_group: AgeGroup; church_name: string }) => { success: boolean; error?: string };
  demoLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  SESSION: 'kkuljaem-session',
  USERS: 'kkuljaem-users',
};

function getStoredUsers(): Record<string, { password: string; user: DemoUser }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, { password: string; user: DemoUser }>) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getSession(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: DemoUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const users = getStoredUsers();
    const entry = users[email.toLowerCase()];

    if (!entry) {
      return { success: false, error: '등록되지 않은 이메일입니다. 회원가입을 먼저 해주세요.' };
    }
    if (entry.password !== password) {
      return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }

    setUser(entry.user);
    saveSession(entry.user);
    return { success: true };
  }, []);

  const signup = useCallback((data: { name: string; email: string; password: string; age_group: AgeGroup; church_name: string }) => {
    const users = getStoredUsers();
    const emailKey = data.email.toLowerCase();

    if (users[emailKey]) {
      return { success: false, error: '이미 가입된 이메일입니다.' };
    }

    const newUser: DemoUser = {
      id: `demo-${Date.now()}`,
      name: data.name,
      email: data.email,
      age_group: data.age_group,
      church_name: data.church_name,
      created_at: new Date().toISOString(),
    };

    users[emailKey] = { password: data.password, user: newUser };
    saveStoredUsers(users);
    setUser(newUser);
    saveSession(newUser);
    return { success: true };
  }, []);

  const demoLogin = useCallback(() => {
    const demoUser: DemoUser = {
      id: 'demo-guest',
      name: '체험 사용자',
      email: 'demo@kkuljaem.app',
      age_group: 'youth',
      church_name: '',
      created_at: new Date().toISOString(),
    };
    setUser(demoUser);
    saveSession(demoUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
