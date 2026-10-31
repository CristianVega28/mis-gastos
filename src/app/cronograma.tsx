import { router } from 'expo-router';
import { CalendarClock, Circle, CircleCheck, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BackHeader } from '@/components/back-header';
import { ModalFrame } from '@/components/modal-frame';
import { MonthSwitcher } from '@/components/month-switcher';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { deleteExpense, markScheduledPaid } from '@/db/mutations';
import { useMonthSchedule, type ScheduleItem } from '@/db/queries';
import { cn } from '@/lib/cn';
import { dayMonth, monthLabel } from '@/lib/dates';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { halfLabel, itemAmount, itemStatus, summarizeByHalf, type ScheduleStatus } from '@/lib/schedule';
import { useThemeColors } from '@/lib/theme';
import { useUI } from '@/store/ui';

export default function ScheduleScreen() {
  const money = useMoney();
  const colors = useThemeColors();
  const month = useUI((s) => s.month);
  const { data: items, loading } = useMonthSchedule(month);

  const halves = summarizeByHalf(items);
  const total = halves.reduce((s, h) => s + h.total, 0);
  const paid = halves.reduce((s, h) => s + h.paid, 0);

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          title="Cronograma de pagos"
          right={<IconButton icon={Plus} accessibilityLabel="Nuevo pago" onPress={() => router.push('/pago-form')} />}
        />
        <View className="mt-2">
          <MonthSwitcher />
        </View>

        {!loading && items.length === 0 ? (
          <Card className="mt-4">
            <EmptyState
              icon={CalendarClock}
              title="Arma tu cronograma"
              description="Agrega lo que pagas cada mes (arriendo, internet, tarjeta…) y el día en que vence. Verás qué toca pagar en cada quincena."
              actionLabel="Agregar pago"
              onAction={() => router.push('/pago-form')}
            />
          </Card>
        ) : (
          <>
            <Card className="mt-4 gap-3">
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-xs text-muted">Pagos de {monthLabel(month)}</Text>
                  <Text weight="bold" tabular className="text-2xl" numberOfLines={1} adjustsFontSizeToFit>
                    {money(total)}
                  </Text>
                </View>
                <Text
                  weight="semibold"
                  tabular
                  className={cn('text-sm', paid >= total ? 'text-success' : 'text-muted')}
                >
                  {paid >= total ? 'Todo pagado ✓' : `Falta ${money(total - paid)}`}
                </Text>
              </View>
              <Progress value={total > 0 ? paid / total : 0} color={colors.success} />
              <Text className="text-xs text-muted">
                Pagado {money(paid)} de {money(total)}
              </Text>
            </Card>

            {halves.map((h) => (
              <View key={h.half}>
                <View className="mb-3 mt-6 flex-row items-center justify-between">
                  <Text weight="bold" className="text-lg">
                    {halfLabel(h.half, month)}
                  </Text>
                  <Text weight="semibold" tabular className="text-sm text-muted">
                    {money(h.total)}
                  </Text>
                </View>
                <Card className="gap-1 px-2 py-2">
                  {h.items.length === 0 ? (
                    <Text className="px-2 py-3 text-sm text-muted">Sin pagos en esta quincena</Text>
                  ) : (
                    h.items.map((item) => <ScheduleRow key={item.id} item={item} month={month} />)
                  )}
                  {h.items.length > 0 && h.pending > 0 && (
                    <Text tabular className="px-2 pb-1 pt-2 text-xs text-muted">
                      Falta pagar {money(h.pending)} de {money(h.total)}
                    </Text>
                  )}
                </Card>
              </View>
            ))}

            <Text className="mt-4 px-1 text-xs text-muted">
              Al marcar un pago se registra como gasto y se descuenta de su cuenta. Si el monto real fue distinto (luz,
              agua), edítalo en Gastos.
            </Text>
          </>
        )}
        <View className="h-4" />
      </Screen>
    </ModalFrame>
  );
}

const STATUS_CLASS: Record<ScheduleStatus['kind'], string> = {
  paid: 'text-success',
  overdue: 'text-danger',
  today: 'text-warning',
  soon: 'text-warning',
  pending: 'text-muted',
};

function statusText(status: ScheduleStatus, item: ScheduleItem) {
  switch (status.kind) {
    case 'paid':
      return `Pagado el ${dayMonth(item.paid!.date)}`;
    case 'overdue':
      return `Atrasado ${status.days} ${status.days === 1 ? 'día' : 'días'}`;
    case 'today':
      return 'Vence hoy';
    case 'soon':
      return `Vence en ${status.days} ${status.days === 1 ? 'día' : 'días'}`;
    case 'pending':
      return 'Pendiente';
  }
}

function ScheduleRow({ item, month }: { item: ScheduleItem; month: string }) {
  const money = useMoney();
  const colors = useThemeColors();
  const status = itemStatus(item);
  const isPaid = status.kind === 'paid';

  const onToggle = () => {
    if (!item.paid) {
      // Si falla, mutate() ya avisó al usuario
      markScheduledPaid(item.id, month, item.dayOfMonth).then(
        () => void haptic.success(),
        () => {},
      );
      return;
    }
    const { expenseId } = item.paid;
    confirm({
      title: 'Marcar como pendiente',
      message: 'Se eliminará el gasto que se registró al pagarlo.',
      confirmText: 'Desmarcar',
      destructive: true,
      onConfirm: async () => {
        await deleteExpense(expenseId);
        haptic.warning();
      },
    });
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/pago-form', params: { id: item.id } })}
      className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-card-2"
    >
      <View
        className={cn('h-12 w-12 items-center justify-center rounded-2xl', isPaid ? 'bg-success-soft' : 'bg-card-2')}
      >
        <Text weight="bold" tabular className={cn('text-lg leading-5', isPaid && 'text-success')}>
          {Number(item.dueDate.slice(8, 10))}
        </Text>
        <Text className="text-[10px] uppercase text-muted">{monthLabel(month, { short: true })}</Text>
      </View>
      <View className="flex-1">
        <Text weight="semibold" numberOfLines={1} className={cn(isPaid && 'text-muted line-through')}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted" numberOfLines={1}>
          <Text className={cn('text-xs', STATUS_CLASS[status.kind])}>{statusText(status, item)}</Text>
          {item.account && ` · ${item.account.name}`}
          {!item.account && item.category && ` · ${item.category.name}`}
        </Text>
      </View>
      <Text weight="bold" tabular className={cn(isPaid && 'text-muted')}>
        {money(itemAmount(item))}
      </Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPaid }}
        accessibilityLabel={isPaid ? `Marcar ${item.title} como pendiente` : `Marcar ${item.title} como pagado`}
        hitSlop={8}
        onPress={onToggle}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
      >
        {isPaid ? (
          <CircleCheck size={26} color={colors.success} strokeWidth={2.2} />
        ) : (
          <Circle size={26} color={status.kind === 'overdue' ? colors.danger : colors.muted} strokeWidth={2} />
        )}
      </Pressable>
    </Pressable>
  );
}
