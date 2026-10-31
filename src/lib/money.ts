export const CURRENCIES = [
  { code: 'CLP', label: 'Peso chileno', locale: 'es-CL' },
  { code: 'PEN', label: 'Sol peruano', locale: 'es-PE' },
  { code: 'ARS', label: 'Peso argentino', locale: 'es-AR' },
  { code: 'MXN', label: 'Peso mexicano', locale: 'es-MX' },
  { code: 'COP', label: 'Peso colombiano', locale: 'es-CO' },
  { code: 'USD', label: 'Dólar', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', locale: 'es-ES' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode, compact: boolean) {
  const key = `${currency}-${compact}`;
  let f = formatters.get(key);
  if (!f) {
    const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? 'es';
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
    });
    formatters.set(key, f);
  }
  return f;
}

/** Los montos se guardan siempre como enteros en centavos. */
export function formatMoney(cents: number, currency: CurrencyCode, opts?: { compact?: boolean }) {
  return getFormatter(currency, opts?.compact ?? false).format(cents / 100);
}

/** "1.234,50" | "1234.5" | "1,234.50" → centavos. Devuelve null si no es un número válido. */
export function parseAmount(input: string): number | null {
  const clean = input.replace(/[^\d.,-]/g, '').trim();
  if (!clean) return null;
  const lastSep = Math.max(clean.lastIndexOf(','), clean.lastIndexOf('.'));
  let normalized: string;
  // Si hay separador con 1-2 dígitos al final, es decimal; si no, es separador de miles.
  if (lastSep >= 0 && clean.length - lastSep - 1 <= 2) {
    normalized = clean.slice(0, lastSep).replace(/[.,]/g, '') + '.' + clean.slice(lastSep + 1);
  } else {
    normalized = clean.replace(/[.,]/g, '');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: number) {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}

/** Reparte un total en n partes enteras; el resto se asigna a las primeras. */
export function splitEvenly(totalCents: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}
