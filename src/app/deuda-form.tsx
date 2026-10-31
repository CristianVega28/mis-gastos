import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, UserPlus } from 'lucide-react-native';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { DateField } from '@/components/forms/date-field';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { saveDebt, setDebtNotification } from '@/db/mutations';
import { useDebt, usePeople } from '@/db/queries';
import { todayISO } from '@/lib/dates';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { centsToInput, parseAmount } from '@/lib/money';
import { cancelReminder, scheduleDebtReminder } from '@/lib/reminders';
import { useThemeColors } from '@/lib/theme';
import { useSettings } from '@/store/settings';

const schema = z.object({
  direction: z.enum(['owed_to_me', 'i_owe']),
  personId: z
    .number()
    .nullable()
    .refine((v) => v !== null, 'Elige una persona'),
  amount: z.string().refine((v) => (parseAmount(v) ?? 0) > 0, 'Ingresa un monto mayor a 0'),
  description: z.string().trim().min(1, 'Describe la deuda'),
  date: z.string(),
  dueDate: z.string().nullable(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function DebtFormScreen() {
  const params = useLocalSearchParams<{ id?: string; personId?: string; direction?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const money = useMoney();
  const { currency, remindersEnabled } = useSettings();

  const { data: people } = usePeople();
  const { data: debt } = useDebt(id);
  const others = people.filter((p) => !p.isMe);

  const { control, handleSubmit, reset } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      direction: params.direction === 'i_owe' ? 'i_owe' : 'owed_to_me',
      personId: params.personId ? Number(params.personId) : null,
      amount: '',
      description: '',
      date: todayISO(),
      dueDate: null,
    },
  });

  useEffect(() => {
    if (!debt) return;
    reset({
      direction: debt.direction,
      personId: debt.personId,
      amount: centsToInput(debt.amountCents),
      description: debt.description,
      date: debt.date,
      dueDate: debt.dueDate,
    });
  }, [debt, reset]);

  const [direction, amount] = useWatch({ control, name: ['direction', 'amount'] });
  const amountCents = parseAmount(amount) ?? 0;

  const onSubmit = handleSubmit(async (v) => {
    const values = {
      personId: v.personId,
      direction: v.direction,
      description: v.description,
      amountCents: parseAmount(v.amount)!,
      date: v.date,
      dueDate: v.dueDate,
    };
    const debtId = await saveDebt(values, id);

    // Reprograma el recordatorio
    await cancelReminder(debt?.notificationId);
    let notificationId: string | null = null;
    if (remindersEnabled && values.dueDate) {
      const paid = debt?.payments.reduce((s, p) => s + p.amountCents, 0) ?? 0;
      notificationId = await scheduleDebtReminder({
        dueDate: values.dueDate,
        personName: people.find((p) => p.id === values.personId)?.name ?? '',
        description: values.description,
        remainingCents: values.amountCents - paid,
        currency,
        direction: values.direction,
      });
    }
    await setDebtNotification(debtId, notificationId);

    haptic.success();
    router.back();
  });

  return (
    <ModalFrame>
      <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalHeader title={id ? 'Editar deuda' : 'Nueva deuda'} />
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'owed_to_me', label: 'Me deben' },
                  { value: 'i_owe', label: 'Yo debo' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <View className="items-center py-2">
                <Text className="text-sm text-muted">Monto</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  className="min-w-40 text-center"
                  style={[
                    {
                      fontFamily: FONTS.extrabold,
                      fontSize: 48,
                      color: direction === 'owed_to_me' ? colors.success : colors.danger,
                    },
                    NO_OUTLINE,
                  ]}
                />
                {amountCents > 0 && <Text className="text-sm text-muted">{money(amountCents)}</Text>}
                {fieldState.error && <Text className="mt-1 text-xs text-danger">{fieldState.error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="personId"
            render={({ field, fieldState }) => (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text weight="medium" className="text-sm text-muted">
                    {direction === 'owed_to_me' ? '¿Quién te debe?' : '¿A quién le debes?'}
                  </Text>
                  <IconButton
                    icon={UserPlus}
                    accessibilityLabel="Nueva persona"
                    onPress={() => router.push('/persona-form')}
                  />
                </View>
                {others.length === 0 && <Text className="text-sm text-muted">Primero agrega a una persona.</Text>}
                <View className="flex-row flex-wrap gap-2">
                  {others.map((p) => (
                    <Chip
                      key={p.id}
                      label={p.name}
                      color={p.color}
                      selected={field.value === p.id}
                      left={<Avatar name={p.name} color={p.color} size={22} />}
                      onPress={() => field.onChange(p.id)}
                    />
                  ))}
                </View>
                {fieldState.error && <Text className="text-xs text-danger">{fieldState.error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Input
                label="Concepto"
                placeholder="Ej: Préstamo, entradas al concierto…"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DateField label="Fecha" value={field.value} onChange={(v) => field.onChange(v ?? todayISO())} />
            )}
          />

          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <View className="gap-1">
                <DateField
                  label="Vence (opcional)"
                  value={field.value}
                  onChange={field.onChange}
                  clearable
                  placeholder="Sin vencimiento"
                />
                {field.value && remindersEnabled && Platform.OS !== 'web' && (
                  <Text className="text-xs text-muted">Te avisaremos ese día a las 10:00.</Text>
                )}
              </View>
            )}
          />
        </ScrollView>
        <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title={id ? 'Guardar cambios' : 'Agregar deuda'} icon={Check} size="lg" onPress={() => onSubmit()} />
        </View>
      </KeyboardAvoidingView>
    </ModalFrame>
  );
}
