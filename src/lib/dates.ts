import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';

/** YYYY-MM-DD en hora local */
export function toISODate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function todayISO() {
  return toISODate(new Date());
}

/** YYYY-MM */
export function monthKey(d: Date = new Date()) {
  return format(d, 'yyyy-MM');
}

export function monthKeyToDate(key: string) {
  return parseISO(`${key}-01`);
}

export function shiftMonth(key: string, delta: number) {
  return monthKey(addMonths(monthKeyToDate(key), delta));
}

export function monthRange(key: string): [string, string] {
  const d = monthKeyToDate(key);
  return [toISODate(startOfMonth(d)), toISODate(endOfMonth(d))];
}

export function monthLabel(key: string, opts?: { short?: boolean }) {
  const label = format(monthKeyToDate(key), opts?.short ? 'MMM' : 'MMMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  const label = format(d, "EEEE d 'de' MMMM", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shortDate(iso: string) {
  return format(parseISO(iso), 'd MMM yyyy', { locale: es });
}

/** "12 oct" */
export function dayMonth(iso: string) {
  return format(parseISO(iso), 'd MMM', { locale: es });
}

export function daysUntil(iso: string) {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

/** Fecha del día `day` en el mes, ajustada al último día si no existe (31 → 30). */
export function dayInMonth(day: number, month: string) {
  const last = endOfMonth(monthKeyToDate(month)).getDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

/** Mismo día en otro mes, ajustado al último día si no existe (31 → 30). */
export function sameDayInMonth(iso: string, targetMonth: string) {
  return dayInMonth(Number(iso.slice(8, 10)), targetMonth);
}
