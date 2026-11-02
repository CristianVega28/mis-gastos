import { router } from 'expo-router';
import { ChevronRight, Plus, Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AccountBadge } from '@/components/account-badge';
import { BackHeader } from '@/components/back-header';
import { ModalFrame } from '@/components/modal-frame';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAccounts } from '@/db/queries';
import { ACCOUNT_TYPES } from '@/lib/account-types';
import { cn } from '@/lib/cn';
import { monthLabel } from '@/lib/dates';
import { useMoney } from '@/lib/format';
import { useThemeColors } from '@/lib/theme';
import { useUI } from '@/store/ui';
import { StatPairSkeleton } from '@/components/skeletons';
import { SkeletonPulse, SkeletonRowsCard } from '@/components/ui/skeleton';

export default function AccountsScreen() {
  const colors = useThemeColors();
  const money = useMoney();
  const month = useUI((s) => s.month);
  const { data: accounts, loading } = useAccounts(month);

  const available = accounts.filter((a) => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
  const creditAvailable = accounts.filter((a) => a.type === 'credit').reduce((s, a) => s + a.balance, 0);
  const monthSpent = accounts.reduce((s, a) => s + a.monthSpent, 0);

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          title="Cuentas"
          right={
            <IconButton icon={Plus} accessibilityLabel="Nueva cuenta" onPress={() => router.push('/cuenta-form')} />
          }
        />

        {loading ? (
          <>
            <StatPairSkeleton className="mt-2" />
            <SkeletonPulse>
              <SkeletonRowsCard className="mt-4" count={3} badge={40} />
            </SkeletonPulse>
          </>
        ) : accounts.length === 0 ? (
          <Card className="mt-2">
            <EmptyState
              icon={Wallet}
              title="Sin cuentas"
              description="Agrega tu cuenta del banco, tarjeta o efectivo y elige desde cuál se descuenta cada gasto."
              actionLabel="Agregar cuenta"
              onAction={() => router.push('/cuenta-form')}
            />
          </Card>
        ) : (
          <>
            <View className="mt-2 flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-xs text-muted">Disponible</Text>
                <Text
                  weight="bold"
                  tabular
                  className={cn('text-lg', available < 0 && 'text-danger')}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {money(available)}
                </Text>
                {creditAvailable > 0 && (
                  <Text className="text-[11px] text-muted" numberOfLines={1}>
                    + {money(creditAvailable)} en crédito
                  </Text>
                )}
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-xs text-muted">Gastado en {monthLabel(month, { short: true })}</Text>
                <Text weight="bold" tabular className="text-lg" numberOfLines={1} adjustsFontSizeToFit>
                  {money(monthSpent)}
                </Text>
              </Card>
            </View>

            <Card className="mt-4 gap-1 px-2 py-2">
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => router.push(`/cuenta/${a.id}`)}
                  className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-card-2"
                >
                  <AccountBadge type={a.type} color={a.color} size={40} />
                  <View className="flex-1">
                    <Text weight="semibold" numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {ACCOUNT_TYPES[a.type].label}
                      {a.monthSpent > 0 && ` · −${money(a.monthSpent)} este mes`}
                    </Text>
                  </View>
                  <Text weight="bold" tabular className={cn(a.balance < 0 && 'text-danger')}>
                    {money(a.balance)}
                  </Text>
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>
              ))}
            </Card>
          </>
        )}
        <View className="h-4" />
      </Screen>
    </ModalFrame>
  );
}
