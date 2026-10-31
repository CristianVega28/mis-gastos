import { api } from '@/lib/api';
import { monthKey } from '@/lib/dates';

import { getDebtNotification } from './debt-notifications';
import type {
  Account,
  AccountDeposit,
  AccountType,
  Category,
  Debt,
  DebtPayment,
  Expense,
  ExpenseSplit,
  Person,
  ScheduledPayment,
} from './types';
import { useLive } from './use-live';

// ─── Gastos ────────────────────────────────────────────────────────────────

export type ExpenseWithRelations = Expense & {
  category: Category | null;
  account: Account | null;
  splits: (ExpenseSplit & { person: Person })[];
};

export function useMonthExpenses(month: string) {
  return useLive(
    () => api<ExpenseWithRelations[]>('/expenses', { query: { month } }),
    [month],
    [] as ExpenseWithRelations[],
  );
}

export function useExpense(id: number | undefined) {
  return useLive(
    async () => (id ? api<ExpenseWithRelations>(`/expenses/${id}`) : null),
    [id],
    null as ExpenseWithRelations | null,
  );
}

/** Totales de los últimos `count` meses terminando en `month`. */
export function useMonthlyTotals(month: string, count = 6) {
  return useLive(
    () => api<{ month: string; total: number }[]>('/stats/monthly', { query: { month, count } }),
    [month, count],
    [] as { month: string; total: number }[],
  );
}

export type CategoryTotal = { id: number | null; name: string; color: string; icon: string | null; total: number };

export function useCategoryBreakdown(month: string) {
  return useLive(() => api<CategoryTotal[]>('/stats/categories', { query: { month } }), [month], [] as CategoryTotal[]);
}

export type PersonMonthSummary = {
  id: number;
  name: string;
  color: string;
  isMe: boolean;
  assigned: number;
  pending: number;
};

/** Cuánto le corresponde a cada persona en el mes y cuánto le falta pagar. */
export function usePeopleMonthSummary(month: string) {
  return useLive(
    () => api<PersonMonthSummary[]>('/stats/people', { query: { month } }),
    [month],
    [] as PersonMonthSummary[],
  );
}

// ─── Personas ──────────────────────────────────────────────────────────────

export type PersonBalance = {
  id: number;
  name: string;
  color: string;
  phone: string | null;
  isMe: boolean;
  /** Partes de gastos asignadas y no pagadas (te deben) */
  pendingSplits: number;
  /** Deudas "me debe" pendientes */
  owesMe: number;
  /** Deudas "le debo" pendientes */
  iOwe: number;
};

export function usePeopleBalances() {
  return useLive(() => api<PersonBalance[]>('/people/balances'), [], [] as PersonBalance[]);
}

export function usePeople() {
  return useLive(() => api<Person[]>('/people'), [], [] as Person[]);
}

export type PersonDetail = {
  person: Person;
  splits: {
    id: number;
    amountCents: number;
    paid: boolean;
    expenseId: number;
    title: string;
    date: string;
    totalCents: number;
    categoryIcon: string | null;
    categoryColor: string | null;
  }[];
  debts: DebtRow[];
};

export function usePersonDetail(id: number) {
  return useLive(() => api<PersonDetail>(`/people/${id}`), [id], null as PersonDetail | null);
}

// ─── Categorías ────────────────────────────────────────────────────────────

export function useCategories() {
  return useLive(() => api<Category[]>('/categories'), [], [] as Category[]);
}

// ─── Deudas ────────────────────────────────────────────────────────────────

export type DebtRow = {
  id: number;
  description: string;
  direction: 'owed_to_me' | 'i_owe';
  amountCents: number;
  date: string;
  dueDate: string | null;
  paidCents: number;
};

export type DebtWithPerson = DebtRow & {
  personId: number;
  personName: string;
  personColor: string;
};

export function useDebts() {
  return useLive(() => api<DebtWithPerson[]>('/debts'), [], [] as DebtWithPerson[]);
}

export type DebtDetail = Debt & {
  person: Person;
  payments: DebtPayment[];
  /** Recordatorio programado en este dispositivo */
  notificationId: string | null;
};

export function useDebt(id: number | undefined) {
  return useLive(
    async () => {
      if (!id) return null;
      const debt = await api<Omit<DebtDetail, 'notificationId'>>(`/debts/${id}`);
      return { ...debt, notificationId: getDebtNotification(id) };
    },
    [id],
    null as DebtDetail | null,
  );
}

// ─── Cuentas ───────────────────────────────────────────────────────────────

export type AccountSummary = {
  id: number;
  name: string;
  type: AccountType;
  color: string;
  initialBalanceCents: number;
  /** Saldo actual. En tarjetas de crédito, el cupo disponible. */
  balance: number;
  /** Gastado desde la cuenta en el mes consultado */
  monthSpent: number;
  /** Último gasto cargado a la cuenta, para sugerirla por defecto */
  lastExpenseId: number | null;
};

export function useAccounts(month = monthKey()) {
  return useLive(() => api<AccountSummary[]>('/accounts', { query: { month } }), [month], [] as AccountSummary[]);
}

export type AccountDetail = {
  account: AccountSummary;
  expenses: ExpenseWithRelations[];
  deposits: AccountDeposit[];
};

export function useAccountDetail(id: number, month = monthKey()) {
  return useLive(
    () => api<AccountDetail>(`/accounts/${id}`, { query: { month } }),
    [id, month],
    null as AccountDetail | null,
  );
}

// ─── Cronograma de pagos ───────────────────────────────────────────────────

export function useScheduledPayments() {
  return useLive(() => api<ScheduledPayment[]>('/scheduled-payments'), [], [] as ScheduledPayment[]);
}

export type ScheduleItem = ScheduledPayment & {
  category: Category | null;
  account: Account | null;
  /** Día en que vence en el mes consultado */
  dueDate: string;
  /** Gasto que lo dejó pagado en el mes, si ya se pagó */
  paid: { expenseId: number; date: string; amountCents: number } | null;
};

/** Pagos del cronograma en el mes, cada uno con su vencimiento y si ya se pagó. */
export function useMonthSchedule(month: string) {
  return useLive(() => api<ScheduleItem[]>('/schedule', { query: { month } }), [month], [] as ScheduleItem[]);
}
