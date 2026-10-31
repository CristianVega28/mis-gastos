import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { User } from '@/db/types';
import { secureStore } from '@/lib/storage';

type AuthState = {
  token: string | null;
  user: User | null;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      signIn: (token, user) => set({ token, user }),
      signOut: () => set({ token: null, user: null }),
    }),
    {
      name: 'session',
      // Lectura síncrona: la sesión está disponible antes del primer render
      storage: createJSONStorage(() => secureStore),
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
