import { api } from '@/lib/api';
import { dayInMonth, monthKey, todayISO } from '@/lib/dates';
import { notify } from '@/lib/dialogs';

import { saveDebtNotification } from './debt-notifications';
import type { AccountType } from './types';
import { invalidate } from './use-live';

/**
 * Ejecuta una escritura en la API y recarga las consultas montadas.
 * Si falla, avisa al usuario y relanza el error para que la pantalla no
 * continúe (por ejemplo, para que no se cierre el formulario).
 */
async function mutate<T>(request: () => Promise<T>): Promise<T> {
  try {
    const result = await request();
    invalidate();
    return result;
  } catch (e) {
    notify('No se pudo guardar', e instanceof Error ? e.message : String(e));
    throw e;
  }
}

type Id = { id: number };

/** Crea (POST) o actualiza (PUT) y devuelve el id. */
async function upsert(path: string, body: unknown, id?: number) {
  const res = await mutate(() => api<Id>(id ? `${path}/${id}` : path, { method: id ? 'PUT' : 'POST', body }));
  return res.id;
}

function remove(path: string) {
  return mutate(() => api<void>(path, { method: 'DELETE' }));
}

// ─── Gastos ────────────────────────────────────────────────────────────────

export type ExpenseInput = {
  title: string;
  amountCents: number;
  date: string;
  categoryId: number | null;
  accountId: number | null;
  note: string | null;
  isRecurring: boolean;
  splits: { personId: number; amountCents: number }[];
};

export function saveExpense(input: ExpenseInput, id?: number) {
  return upsert('/expenses', input, id);
}

export function deleteExpense(id: number) {
  return remove(`/expenses/${id}`);
}

export function setSplitPaid(splitId: number, paid: boolean) {
  return mutate(() => api<void>(`/splits/${splitId}`, { method: 'PATCH', body: { paid, date: todayISO() } }));
}

export function markAllSplitsPaid(personId: number) {
  return mutate(() => api<void>(`/people/${personId}/settle-splits`, { method: 'POST', body: { date: todayISO() } }));
}

/**
 * Copia los gastos marcados como recurrentes de `fromMonth` a `toMonth`,
 * omitiendo los que ya existen (mismo título y recurrente) en el destino.
 */
export async function copyRecurring(fromMonth: string, toMonth: string) {
  const res = await mutate(() =>
    api<{ created: number }>('/expenses/copy-recurring', { method: 'POST', body: { from: fromMonth, to: toMonth } }),
  );
  return res.created;
}

// ─── Cuentas ───────────────────────────────────────────────────────────────

export type AccountInput = { name: string; type: AccountType; color: string; initialBalanceCents: number };

export function saveAccount(input: AccountInput, id?: number) {
  return upsert('/accounts', input, id);
}

/** Elimina la cuenta y sus ingresos; sus gastos se conservan sin cuenta. */
export function deleteAccount(id: number) {
  return remove(`/accounts/${id}`);
}

export async function addAccountDeposit(accountId: number, amountCents: number, date = todayISO(), note?: string) {
  await mutate(() =>
    api<Id>(`/accounts/${accountId}/deposits`, { method: 'POST', body: { amountCents, date, note: note ?? null } }),
  );
}

export function deleteAccountDeposit(id: number) {
  return remove(`/deposits/${id}`);
}

// ─── Cronograma de pagos ───────────────────────────────────────────────────

export type ScheduledPaymentInput = {
  title: string;
  amountCents: number;
  dayOfMonth: number;
  categoryId: number | null;
  accountId: number | null;
  note: string | null;
};

export function saveScheduledPayment(input: ScheduledPaymentInput, id?: number) {
  return upsert('/scheduled-payments', input, id);
}

/** Elimina el pago del cronograma; los gastos ya registrados se conservan. */
export function deleteScheduledPayment(id: number) {
  return remove(`/scheduled-payments/${id}`);
}

/**
 * Registra el pago de `month` como un gasto (100 % "Yo") ligado al cronograma.
 * La fecha es hoy si se paga dentro del mismo mes; si no, el día en que vence.
 */
export async function markScheduledPaid(id: number, month: string, dayOfMonth: number) {
  const date = month === monthKey() ? todayISO() : dayInMonth(dayOfMonth, month);
  const res = await mutate(() =>
    api<{ expenseId: number }>(`/scheduled-payments/${id}/pay`, { method: 'POST', body: { date } }),
  );
  return res.expenseId;
}

// ─── Personas ──────────────────────────────────────────────────────────────

export type PersonInput = { name: string; color: string; phone: string | null };

export function savePerson(input: PersonInput, id?: number) {
  return upsert('/people', input, id);
}

export function deletePerson(id: number) {
  return remove(`/people/${id}`);
}

// ─── Categorías ────────────────────────────────────────────────────────────

export type CategoryInput = { name: string; icon: string; color: string };

export function saveCategory(input: CategoryInput, id?: number) {
  return upsert('/categories', input, id);
}

export function deleteCategory(id: number) {
  return remove(`/categories/${id}`);
}

// ─── Deudas ────────────────────────────────────────────────────────────────

export type DebtInput = {
  personId: number;
  direction: 'owed_to_me' | 'i_owe';
  description: string;
  amountCents: number;
  date: string;
  dueDate: string | null;
};

export function saveDebt(input: DebtInput, id?: number) {
  return upsert('/debts', input, id);
}

/** El recordatorio vive en el dispositivo: se guarda localmente. */
export async function setDebtNotification(id: number, notificationId: string | null) {
  saveDebtNotification(id, notificationId);
  invalidate();
}

export function deleteDebt(id: number) {
  saveDebtNotification(id, null);
  return remove(`/debts/${id}`);
}

export async function addDebtPayment(debtId: number, amountCents: number, date = todayISO(), note?: string) {
  await mutate(() =>
    api<Id>(`/debts/${debtId}/payments`, { method: 'POST', body: { amountCents, date, note: note ?? null } }),
  );
}

export function deleteDebtPayment(id: number) {
  return remove(`/debt-payments/${id}`);
}

/** Registra un abono por el saldo restante. */
export function settleDebt(debtId: number) {
  return mutate(() => api<void>(`/debts/${debtId}/settle`, { method: 'POST', body: { date: todayISO() } }));
}
