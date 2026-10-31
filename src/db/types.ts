// Entidades tal como las devuelve la API. Montos en centavos, fechas "YYYY-MM-DD".

export type Person = {
  id: number;
  name: string;
  color: string;
  phone: string | null;
  isMe: boolean;
  createdAt: string;
};

export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
};

/** cash: efectivo · debit: cuenta o débito · credit: tarjeta de crédito · savings: ahorro */
export type AccountType = 'cash' | 'debit' | 'credit' | 'savings';

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  color: string;
  /** Saldo con el que parte la cuenta (en tarjetas de crédito, el cupo disponible). */
  initialBalanceCents: number;
  createdAt: string;
};

/** Dinero que entra a una cuenta (sueldo, depósito o pago de la tarjeta). */
export type AccountDeposit = {
  id: number;
  accountId: number;
  amountCents: number;
  date: string;
  note: string | null;
};

export type Expense = {
  id: number;
  title: string;
  amountCents: number;
  date: string;
  categoryId: number | null;
  /** Cuenta de la que se descuenta el gasto */
  accountId: number | null;
  note: string | null;
  isRecurring: boolean;
  /** Pago del cronograma que este gasto deja pagado en su mes */
  scheduledPaymentId: number | null;
  createdAt: string;
};

export type ExpenseSplit = {
  id: number;
  expenseId: number;
  personId: number;
  amountCents: number;
  paid: boolean;
  paidAt: string | null;
};

export type DebtDirection = 'owed_to_me' | 'i_owe';

export type Debt = {
  id: number;
  personId: number;
  /** owed_to_me: la persona me debe · i_owe: yo le debo */
  direction: DebtDirection;
  description: string;
  amountCents: number;
  date: string;
  dueDate: string | null;
  createdAt: string;
};

export type DebtPayment = {
  id: number;
  debtId: number;
  amountCents: number;
  date: string;
  note: string | null;
};

/** Pago que se repite cada mes en un día fijo (arriendo, internet, tarjeta…). */
export type ScheduledPayment = {
  id: number;
  title: string;
  amountCents: number;
  /** 1–31. Si el mes no tiene ese día, vence el último día del mes. */
  dayOfMonth: number;
  categoryId: number | null;
  accountId: number | null;
  note: string | null;
  createdAt: string;
};

export type User = {
  id: number;
  email: string;
  name: string;
  createdAt: string;
};
