import type { ScheduleItem } from '@/db/queries';

import { daysUntil, monthRange } from './dates';

export type Half = 'first' | 'second';

/** 1ª quincena: días 1–15 · 2ª quincena: del 16 a fin de mes. */
export function halfOf(dueDate: string): Half {
  return Number(dueDate.slice(8, 10)) <= 15 ? 'first' : 'second';
}

export function halfLabel(half: Half, month: string) {
  const lastDay = Number(monthRange(month)[1].slice(8, 10));
  return half === 'first' ? '1ª quincena · 1 al 15' : `2ª quincena · 16 al ${lastDay}`;
}

/** Monto que cuenta para el pago: lo pagado de verdad o lo programado. */
export function itemAmount(item: ScheduleItem) {
  return item.paid?.amountCents ?? item.amountCents;
}

export type ScheduleStatus =
  | { kind: 'paid' }
  | { kind: 'overdue'; days: number }
  | { kind: 'today' }
  | { kind: 'soon'; days: number }
  | { kind: 'pending' };

export function itemStatus(item: ScheduleItem): ScheduleStatus {
  if (item.paid) return { kind: 'paid' };
  const days = daysUntil(item.dueDate);
  if (days < 0) return { kind: 'overdue', days: -days };
  if (days === 0) return { kind: 'today' };
  if (days <= 3) return { kind: 'soon', days };
  return { kind: 'pending' };
}

export type HalfSummary = { half: Half; items: ScheduleItem[]; total: number; paid: number; pending: number };

export function summarizeByHalf(items: ScheduleItem[]): HalfSummary[] {
  return (['first', 'second'] as const).map((half) => {
    const list = items.filter((i) => halfOf(i.dueDate) === half);
    const total = list.reduce((s, i) => s + itemAmount(i), 0);
    const paid = list.reduce((s, i) => s + (i.paid ? i.paid.amountCents : 0), 0);
    return { half, items: list, total, paid, pending: total - paid };
  });
}
