import { router } from 'expo-router';
import { HandCoins, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DebtCard } from '@/components/debt-card';
import { Fab } from '@/components/fab';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { useDebts } from '@/db/queries';
import { useMoney } from '@/lib/format';
import { useIsDesktop } from '@/lib/layout';

type Direction = 'owed_to_me' | 'i_owe';
type Status = 'pending' | 'paid' | 'all';

export default function DebtsScreen() {
  const money = useMoney();
  const isDesktop = useIsDesktop();
  const { data: debts, loading } = useDebts();
  const [direction, setDirection] = useState<Direction>('owed_to_me');
  const [status, setStatus] = useState<Status>('pending');

  const { list, pendingTotal } = useMemo(() => {
    const byDirection = debts.filter((d) => d.direction === direction);
    const pendingTotal = byDirection.reduce((s, d) => s + Math.max(d.amountCents - d.paidCents, 0), 0);
    const list = byDirection.filter((d) => {
      const settled = d.paidCents >= d.amountCents;
      return status === 'all' || (status === 'paid' ? settled : !settled);
    });
    return { list, pendingTotal };
  }, [debts, direction, status]);

  const newDebt = () => router.push({ pathname: '/deuda-form', params: { direction } });

  return (
    <View className="flex-1 bg-background">
      <Screen>
        <ScreenHeader
          title="Deudas"
          subtitle="Lo que te deben y lo que debes"
          right={<IconButton icon={Plus} accessibilityLabel="Nueva deuda" onPress={newDebt} />}
        />

        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'owed_to_me', label: 'Me deben' },
            { value: 'i_owe', label: 'Debo' },
          ]}
        />

        <Card className="mt-4 items-center gap-1 py-6">
          <Text className="text-sm text-muted">
            {direction === 'owed_to_me' ? 'Total por cobrar' : 'Total por pagar'}
          </Text>
          <Text
            weight="extrabold"
            tabular
            className={direction === 'owed_to_me' ? 'text-4xl text-success' : 'text-4xl text-danger'}
          >
            {money(pendingTotal)}
          </Text>
        </Card>

        <View className="mb-3 mt-5 flex-row gap-2">
          <Chip label="Pendientes" selected={status === 'pending'} onPress={() => setStatus('pending')} />
          <Chip label="Pagadas" selected={status === 'paid'} onPress={() => setStatus('paid')} />
          <Chip label="Todas" selected={status === 'all'} onPress={() => setStatus('all')} />
        </View>

        {!loading && list.length === 0 ? (
          <Card>
            <EmptyState
              icon={HandCoins}
              title={status === 'paid' ? 'Nada pagado aún' : 'Sin deudas pendientes'}
              description={
                direction === 'owed_to_me'
                  ? 'Anota cuando le prestes dinero a alguien y registra sus abonos.'
                  : 'Anota lo que debes para no olvidarlo.'
              }
              actionLabel="Nueva deuda"
              onAction={newDebt}
            />
          </Card>
        ) : (
          <View className={isDesktop ? 'flex-row flex-wrap justify-between gap-y-3' : 'gap-3'}>
            {list.map((d, i) => (
              <Animated.View
                key={d.id}
                entering={FadeInDown.delay(i * 40).duration(300)}
                style={isDesktop ? { width: '49.2%' } : undefined}
              >
                <DebtCard debt={d} person={{ name: d.personName, color: d.personColor }} />
              </Animated.View>
            ))}
          </View>
        )}
      </Screen>
      <Fab label="Nueva deuda" onPress={newDebt} />
    </View>
  );
}
