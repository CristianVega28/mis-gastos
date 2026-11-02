import { router, useLocalSearchParams } from 'expo-router';
import { CalendarClock, CheckCheck, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DetailPlaceholder } from '@/components/detail-placeholder';
import { ModalFrame } from '@/components/modal-frame';
import { BackHeader } from '@/components/back-header';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { addDebtPayment, deleteDebt, deleteDebtPayment, setDebtNotification, settleDebt } from '@/db/mutations';
import { useDebt } from '@/db/queries';
import { shortDate } from '@/lib/dates';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { parseAmount } from '@/lib/money';
import { cancelReminder } from '@/lib/reminders';
import { useThemeColors } from '@/lib/theme';
import { goBack } from '@/lib/navigation';

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const money = useMoney();
  const colors = useThemeColors();
  const { data: debt, error } = useDebt(Number(id));
  const [payment, setPayment] = useState('');

  if (!debt) return <DetailPlaceholder error={error} notFound="Esta deuda ya no existe" />;

  const paid = debt.payments.reduce((s, p) => s + p.amountCents, 0);
  const remaining = Math.max(debt.amountCents - paid, 0);
  const settled = remaining === 0;
  const owedToMe = debt.direction === 'owed_to_me';
  const tone = owedToMe ? colors.success : colors.danger;
  const paymentCents = parseAmount(payment) ?? 0;

  const clearReminder = async () => {
    if (debt.notificationId) {
      await cancelReminder(debt.notificationId);
      await setDebtNotification(debt.id, null);
    }
  };

  const onAddPayment = async () => {
    if (paymentCents <= 0) return;
    await addDebtPayment(debt.id, Math.min(paymentCents, remaining));
    if (paymentCents >= remaining) await clearReminder();
    setPayment('');
    haptic.success();
  };

  const onSettle = () =>
    confirm({
      title: 'Saldar deuda',
      message: `Se registrará un pago de ${money(remaining)}.`,
      confirmText: 'Saldar',
      onConfirm: async () => {
        await settleDebt(debt.id);
        await clearReminder();
        haptic.success();
      },
    });

  const onDelete = () =>
    confirm({
      title: 'Eliminar deuda',
      message: 'Se eliminará la deuda y todos sus abonos.',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await cancelReminder(debt.notificationId);
        await deleteDebt(debt.id);
        haptic.warning();
        goBack();
      },
    });

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          title="Deuda"
          right={
            <>
              <IconButton
                icon={Pencil}
                accessibilityLabel="Editar"
                onPress={() => router.push({ pathname: '/deuda-form', params: { id: debt.id } })}
              />
              <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
            </>
          }
        />

        <Card className="mt-2 items-center gap-3 py-6">
          <Pressable onPress={() => router.push(`/persona/${debt.person.id}`)} className="items-center gap-2">
            <Avatar name={debt.person.name} color={debt.person.color} size={56} />
            <Text className="text-sm text-muted">
              {owedToMe ? `${debt.person.name} te debe` : `Le debes a ${debt.person.name}`}
            </Text>
          </Pressable>
          <Text weight="extrabold" tabular className="text-4xl" style={{ color: settled ? colors.muted : tone }}>
            {money(remaining)}
          </Text>
          <Text weight="semibold" className="text-base">
            {debt.description}
          </Text>
          <View className="w-full gap-2 px-2">
            <Progress value={debt.amountCents ? paid / debt.amountCents : 0} color={tone} />
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Pagado {money(paid)}</Text>
              <Text className="text-xs text-muted">Total {money(debt.amountCents)}</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap justify-center gap-2">
            <View className="rounded-full bg-card-2 px-3 py-1">
              <Text className="text-xs text-muted">Desde {shortDate(debt.date)}</Text>
            </View>
            {debt.dueDate && (
              <View className="flex-row items-center gap-1 rounded-full bg-card-2 px-3 py-1">
                <CalendarClock size={12} color={colors.muted} />
                <Text className="text-xs text-muted">Vence {shortDate(debt.dueDate)}</Text>
              </View>
            )}
            {settled && (
              <View className="rounded-full bg-success-soft px-3 py-1">
                <Text weight="semibold" className="text-xs text-success">
                  Saldada ✓
                </Text>
              </View>
            )}
          </View>
        </Card>

        {!settled && (
          <Animated.View entering={FadeIn}>
            <SectionTitle title="Registrar abono" />
            <Card className="gap-3">
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={payment}
                  onChangeText={setPayment}
                  placeholder="Monto del abono"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  className="h-12 flex-1 rounded-2xl bg-card-2 px-4 text-base text-foreground"
                  style={[{ fontFamily: FONTS.semibold }, NO_OUTLINE]}
                  onSubmitEditing={onAddPayment}
                />
                <Button title="Abonar" icon={Plus} onPress={onAddPayment} disabled={paymentCents <= 0} />
              </View>
              {paymentCents > remaining && (
                <Text className="text-xs text-warning">Se registrará como máximo {money(remaining)}.</Text>
              )}
              <Button
                title={`Saldar todo (${money(remaining)})`}
                icon={CheckCheck}
                variant="success"
                onPress={onSettle}
              />
            </Card>
          </Animated.View>
        )}

        <SectionTitle title={`Abonos (${debt.payments.length})`} />
        {debt.payments.length === 0 ? (
          <Text className="text-center text-sm text-muted">Aún no hay abonos.</Text>
        ) : (
          <Card className="gap-1 px-2 py-2">
            {debt.payments.map((p) => (
              <View key={p.id} className="flex-row items-center gap-3 px-2 py-2.5">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${tone}22` }}
                >
                  <CheckCheck size={18} color={tone} />
                </View>
                <View className="flex-1">
                  <Text weight="semibold" tabular>
                    {money(p.amountCents)}
                  </Text>
                  <Text className="text-xs text-muted">
                    {shortDate(p.date)}
                    {p.note ? ` · ${p.note}` : ''}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  accessibilityLabel="Eliminar abono"
                  onPress={() =>
                    confirm({
                      title: 'Eliminar abono',
                      message: `¿Eliminar el abono de ${money(p.amountCents)}?`,
                      confirmText: 'Eliminar',
                      destructive: true,
                      onConfirm: () => deleteDebtPayment(p.id),
                    })
                  }
                >
                  <X size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </Screen>
    </ModalFrame>
  );
}
