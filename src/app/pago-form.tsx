import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountBadge } from '@/components/account-badge';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Button, IconButton } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { deleteScheduledPayment, saveScheduledPayment } from '@/db/mutations';
import { useAccounts, useCategories, useScheduledPayments } from '@/db/queries';
import type { ScheduledPayment } from '@/db/types';
import { cn } from '@/lib/cn';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { centsToInput, parseAmount } from '@/lib/money';
import { useThemeColors } from '@/lib/theme';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function ScheduledPaymentFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const { data: payments, loading } = useScheduledPayments();
  const payment = id ? payments.find((p) => p.id === id) : undefined;

  // Al editar, espera a tener el pago para inicializar el formulario
  if (id && (loading || !payment)) return <View className="flex-1 bg-background" />;
  return (
    <ModalFrame>
      <ScheduledPaymentForm key={payment?.id ?? 'new'} id={id} initial={payment} />
    </ModalFrame>
  );
}

function ScheduledPaymentForm({ id, initial }: { id?: number; initial?: ScheduledPayment }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const money = useMoney();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const [amount, setAmount] = useState(initial ? centsToInput(initial.amountCents) : '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [day, setDay] = useState(initial?.dayOfMonth ?? 30);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [accountId, setAccountId] = useState<number | null>(initial?.accountId ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<{ amount?: string; title?: string }>({});
  const amountCents = parseAmount(amount) ?? 0;

  const onSave = async () => {
    const next = {
      amount: amountCents > 0 ? undefined : 'Ingresa un monto mayor a 0',
      title: title.trim() ? undefined : 'Ponle un nombre al pago',
    };
    if (next.amount || next.title) {
      setErrors(next);
      return;
    }
    await saveScheduledPayment({ title, amountCents, dayOfMonth: day, categoryId, accountId, note }, id);
    haptic.success();
    router.back();
  };

  const onDelete = () =>
    confirm({
      title: 'Eliminar pago',
      message: 'Dejará de aparecer en el cronograma. Los gastos que ya registraste se conservan.',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await deleteScheduledPayment(id!);
        haptic.warning();
        router.back();
      },
    });

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader
        title={id ? 'Editar pago' : 'Nuevo pago'}
        right={
          id ? (
            <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
          ) : null
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        {/* Monto */}
        <View className="items-center py-4">
          <Text className="text-sm text-muted">Monto mensual</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setErrors((e) => ({ ...e, amount: undefined }));
            }}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            autoFocus={!id}
            className="min-w-40 text-center text-foreground"
            style={[{ fontFamily: FONTS.extrabold, fontSize: 48 }, NO_OUTLINE]}
          />
          {amountCents > 0 && <Text className="text-sm text-muted">{money(amountCents)}</Text>}
          {errors.amount && <Text className="mt-1 text-xs text-danger">{errors.amount}</Text>}
        </View>

        <Input
          label="Descripción"
          placeholder="Ej: Arriendo, internet, tarjeta…"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            setErrors((e) => ({ ...e, title: undefined }));
          }}
          error={errors.title}
        />

        {/* Día de pago */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text weight="medium" className="text-sm text-muted">
              Día de pago
            </Text>
            <Text weight="semibold" className="text-sm text-primary">
              {day <= 15 ? '1ª quincena' : '2ª quincena'}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {DAYS.map((d) => {
              const selected = d === day;
              return (
                <Pressable
                  key={d}
                  accessibilityLabel={`Día ${d}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptic.selection();
                    setDay(d);
                  }}
                  className={cn(
                    'h-10 w-[12.5%] items-center justify-center rounded-xl border',
                    selected ? 'border-primary bg-primary' : 'border-transparent bg-card',
                    d === 15 && !selected && 'border-border',
                  )}
                >
                  <Text weight={selected ? 'bold' : 'medium'} tabular className={cn(selected && 'text-on-primary')}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {day > 28 && (
            <Text className="text-xs text-muted">Los meses que no tengan el día {day} vencerá el último día.</Text>
          )}
        </View>

        {/* Categoría */}
        <View className="gap-2">
          <Text weight="medium" className="text-sm text-muted">
            Categoría
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => {
              const selected = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    haptic.selection();
                    setCategoryId(selected ? null : c.id);
                  }}
                  className={cn(
                    'w-[23%] items-center gap-1.5 rounded-2xl border py-3',
                    selected ? 'border-primary bg-primary-soft' : 'border-transparent bg-card',
                  )}
                >
                  <IconBadge icon={c.icon} color={c.color} size={36} />
                  <Text weight={selected ? 'semibold' : 'medium'} className="text-[11px]" numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Cuenta */}
        {accounts.length > 0 && (
          <View className="gap-2">
            <Text weight="medium" className="text-sm text-muted">
              ¿De dónde se paga?
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5"
              contentContainerClassName="gap-2 px-5"
            >
              {accounts.map((a) => {
                const selected = accountId === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      haptic.selection();
                      setAccountId(selected ? null : a.id);
                    }}
                    className={cn(
                      'w-36 gap-2 rounded-2xl border p-3',
                      selected ? 'border-primary bg-primary-soft' : 'border-transparent bg-card',
                    )}
                  >
                    <AccountBadge type={a.type} color={a.color} size={32} />
                    <Text weight={selected ? 'semibold' : 'medium'} className="text-sm" numberOfLines={1}>
                      {a.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Input
          label="Nota (opcional)"
          placeholder="Ej: número de cliente, cómo se paga"
          value={note}
          onChangeText={setNote}
          multiline
          className="h-auto min-h-13 py-3"
        />
      </ScrollView>
      <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button title={id ? 'Guardar cambios' : 'Agregar al cronograma'} icon={Check} size="lg" onPress={onSave} />
      </View>
    </KeyboardAvoidingView>
  );
}
