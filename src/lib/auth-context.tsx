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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; age_group: AgeGroup; church_name: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; age_group?: AgeGroup; church_name?: string }) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  SESSION: 'kkuljaem-session',
  USERS: 'kkuljaem-users',
};

// 비밀번호 해시 (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kkuljaem-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// === localStorage 헬퍼 (폴백용) ===
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

  const login = useCallback(async (email: string, password: string) => {
    const hashed = await hashPassword(password);

    // 1. 서버 API로 로그인 시도
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password_hash: hashed }),
      });
      const data = await res.json();

      if (data.user) {
        const serverUser: DemoUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          age_group: data.user.age_group,
          church_name: data.user.church_name || '',
          created_at: data.user.created_at,
        };
        setUser(serverUser);
        saveSession(serverUser);

        // localStorage에도 동기화 (오프라인 폴백)
        const users = getStoredUsers();
        users[email.toLowerCase()] = { password: hashed, user: serverUser };
        saveStoredUsers(users);

        return { success: true };
      }

      // 서버에서 못 찾으면 fallback으로 아래 진행
      if (!data.fallback) {
        return { success: false, error: data.error || '로그인에 실패했습니다.' };
      }
    } catch {
      // 서버 연결 실패 → localStorage 폴백
    }

    // 2. localStorage 폴백
    const users = getStoredUsers();
    const entry = users[email.toLowerCase()];

    if (!entry) {
      return { success: false, error: '등록되지 않은 이메일입니다. 회원가입을 먼저 해주세요.' };
    }

    if (entry.password !== hashed) {
      return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }

    setUser(entry.user);
    saveSession(entry.user);
    return { success: true };
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; password: string; age_group: AgeGroup; church_name: string }) => {
    const hashed = await hashPassword(data.password);
    const emailKey = data.email.toLowerCase();

    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      age_group: data.age_group,
      church_name: data.church_name,
      created_at: new Date().toISOString(),
    };

    // 1. 서버 API로 가입 시도
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailKey,
          password_hash: hashed,
          name: data.name,
          age_group: data.age_group,
          church_name: data.church_name,
        }),
      });
      const result = await res.json();

      if (result.user) {
        const serverUser: DemoUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          age_group: result.user.age_group,
          church_name: result.user.church_name || '',
          created_at: result.user.created_at,
        };
        newUser.id = serverUser.id;
        Object.assign(newUser, serverUser);
      } else if (res.status === 409) {
        return { success: false, error: '이미 가입된 이메일입니다.' };
      }
      // fallback이면 아래에서 localStorage에 저장
    } catch {
      // 서버 연결 실패 → localStorage에만 저장
    }

    // 2. localStorage에도 저장 (오프라인 폴백 + 백업)
    const users = getStoredUsers();
    if (users[emailKey] && !users[emailKey].user) {
      return { success: false, error: '이미 가입된 이메일입니다.' };
    }
    users[emailKey] = { password: hashed, user: newUser };
    saveStoredUsers(users);

    setUser(newUser);
    saveSession(newUser);
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    const hashed = await hashPassword(newPassword);
    const emailKey = email.toLowerCase();

    // 1. 서버 API로 재설정 시도
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailKey, new_password_hash: hashed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // localStorage도 동기화
        const users = getStoredUsers();
        if (users[emailKey]) {
          users[emailKey].password = hashed;
          saveStoredUsers(users);
        }
        return { success: true };
      }

      if (!data.fallback) {
        return { success: false, error: data.error || '비밀번호 재설정에 실패했습니다.' };
      }
    } catch {
      // 서버 연결 실패 → localStorage 폴백
    }

    // 2. localStorage 폴백
    const users = getStoredUsers();
    if (!users[emailKey]) {
      return { success: false, error: '등록되지 않은 이메일입니다.' };
    }
    users[emailKey].password = hashed;
    saveStoredUsers(users);
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

  const updateProfile = useCallback(async (data: { name?: string; age_group?: AgeGroup; church_name?: string }) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    const merged: DemoUser = {
      ...user,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.age_group !== undefined ? { age_group: data.age_group } : {}),
      ...(data.church_name !== undefined ? { church_name: data.church_name } : {}),
    };

    // 데모 계정은 서버 동기화 건너뛰기
    if (user.id !== 'demo-guest') {
      try {
        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email.toLowerCase(),
            name: data.name,
            age_group: data.age_group,
            church_name: data.church_name,
          }),
        });
        const result = await res.json();

        if (res.ok && result.user) {
          const serverUser: DemoUser = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            age_group: result.user.age_group,
            church_name: result.user.church_name || '',
            created_at: result.user.created_at,
          };
          Object.assign(merged, serverUser);
        } else if (!result.fallback) {
          return { success: false, error: result.error || '프로필 저장에 실패했습니다.' };
        }
      } catch {
        // 서버 연결 실패 → localStorage 폴백
      }
    }

    setUser(merged);
    saveSession(merged);

    // localStorage의 users 목록도 업데이트
    const users = getStoredUsers();
    const emailKey = user.email.toLowerCase();
    if (users[emailKey]) {
      users[emailKey].user = merged;
      saveStoredUsers(users);
    }
    return { success: true };
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, resetPassword, updateProfile, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
