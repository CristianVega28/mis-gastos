import { Banknote, CreditCard, Landmark, PiggyBank, type LucideIcon } from 'lucide-react-native';

import type { AccountType } from '@/db/types';

export const ACCOUNT_TYPES: Record<
  AccountType,
  {
    label: string;
    icon: LucideIcon;
    /** Cómo se pide el saldo de hoy en el formulario */
    initialLabel: string;
    /** Cómo se llama el saldo actual */
    balanceLabel: string;
    /** Acción para sumar dinero a la cuenta */
    depositLabel: string;
  }
> = {
  debit: {
    label: 'Cuenta / débito',
    icon: Landmark,
    initialLabel: 'Saldo actual',
    balanceLabel: 'Saldo',
    depositLabel: 'Agregar dinero',
  },
  cash: {
    label: 'Efectivo',
    icon: Banknote,
    initialLabel: 'Efectivo que tienes',
    balanceLabel: 'Saldo',
    depositLabel: 'Agregar dinero',
  },
  credit: {
    label: 'Tarjeta de crédito',
    icon: CreditCard,
    initialLabel: 'Cupo disponible hoy',
    balanceLabel: 'Cupo disponible',
    depositLabel: 'Pagar tarjeta',
  },
  savings: {
    label: 'Ahorro',
    icon: PiggyBank,
    initialLabel: 'Saldo actual',
    balanceLabel: 'Saldo',
    depositLabel: 'Agregar dinero',
  },
};

export const ACCOUNT_TYPE_KEYS = Object.keys(ACCOUNT_TYPES) as AccountType[];
