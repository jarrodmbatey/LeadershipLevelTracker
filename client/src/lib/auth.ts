import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'leader' | 'manager';
  project: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string, name: string, role: User['role'], project: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error('Invalid credentials');
    }

    const { user } = await res.json();
    set({ user });

    // Return the appropriate redirect path based on user role
    return user.role === 'admin' ? '/admin' : '/dashboard';
  },
  register: async (email, password, name, role, project) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, project }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Registration failed');
    }

    const { user } = await res.json();
    set({ user });
  },
  logout: () => {
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/user');
      if (res.ok) {
        const { user } = await res.json();
        set({ user });
      }
    } finally {
      set({ loading: false });
    }
  },
}));