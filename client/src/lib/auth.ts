import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'leader' | 'manager';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: User['role']) => Promise<void>;
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
  },
  register: async (email, password, name, role) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    
    if (!res.ok) {
      throw new Error('Registration failed');
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
