import { View } from 'react-native';

import type { AccountType } from '@/db/types';
import { ACCOUNT_TYPES } from '@/lib/account-types';
import { withAlpha } from '@/lib/palette';

/** Ícono del tipo de cuenta dentro de un cuadrado redondeado con su color. */
export function AccountBadge({ type, color, size = 44 }: { type: AccountType; color: string; size?: number }) {
  const Icon = ACCOUNT_TYPES[type].icon;
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: withAlpha(color, 0.16) }}
    >
      <Icon size={size * 0.48} color={color} strokeWidth={2.2} />
    </View>
  );
}
