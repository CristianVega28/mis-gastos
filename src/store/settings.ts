import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CurrencyCode } from '@/lib/money';
import { localStore } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  currency: CurrencyCode;
  theme: ThemePreference;
  lockEnabled: boolean;
  remindersEnabled: boolean;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemePreference) => void;
  setLockEnabled: (enabled: boolean) => void;
  setRemindersEnabled: (enabled: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'CLP',
      theme: 'system',
      lockEnabled: false,
      remindersEnabled: true,
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setLockEnabled: (lockEnabled) => set({ lockEnabled }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
    }),
    {
      name: 'settings',
      // Lectura síncrona: el estado está hidratado antes del primer render
      storage: createJSONStorage(() => localStore),
    },
  ),
);
