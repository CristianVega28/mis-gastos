import { useCallback } from 'react';

import { useSettings } from '@/store/settings';

import { formatMoney } from './money';

/** Formateador de montos ligado a la moneda elegida en Ajustes. */
export function useMoney() {
  const currency = useSettings((s) => s.currency);
  return useCallback((cents: number, opts?: { compact?: boolean }) => formatMoney(cents, currency, opts), [currency]);
}
