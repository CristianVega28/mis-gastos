import { create } from 'zustand';

import { monthKey, shiftMonth } from '@/lib/dates';

type UIState = {
  /** Mes seleccionado (YYYY-MM), compartido entre Inicio y Gastos */
  month: string;
  setMonth: (month: string) => void;
  shift: (delta: number) => void;
};

export const useUI = create<UIState>()((set) => ({
  month: monthKey(),
  setMonth: (month) => set({ month }),
  shift: (delta) => set((s) => ({ month: shiftMonth(s.month, delta) })),
}));
