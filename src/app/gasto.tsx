import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Plus, Repeat, Trash2, UserPlus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AccountBadge } from '@/components/account-badge';
import { DateField } from '@/components/forms/date-field';
import { FormPlaceholder } from '@/components/detail-placeholder';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { SwitchRow } from '@/components/ui/switch-row';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { deleteExpense, saveExpense } from '@/db/mutations';
import { useAccounts, useCategories, useExpense, usePeople } from '@/db/queries';
import { cn } from '@/lib/cn';
import { todayISO } from '@/lib/dates';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { centsToInput, parseAmount, splitEvenly } from '@/lib/money';
import { useThemeColors } from '@/lib/theme';
import { goBack } from '@/lib/navigation';
import { Skeleton, SkeletonBadge, SkeletonPulse } from '@/components/ui/skeleton';

const schema = z
  .object({
    amount: z.string().refine((v) => (parseAmount(v) ?? 0) > 0, 'Ingresa un monto mayor a 0'),
    title: z.string().trim().min(1, 'Ponle un nombre al gasto'),
    categoryId: z.number().nullable(),
    accountId: z.number().nullable(),
    date: z.string(),
    isRecurring: z.boolean(),
    note: z.string(),
    splitMode: z.enum(['equal', 'custom']),
    personIds: z.array(z.number()),
    custom: z.record(z.string(), z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.splitMode !== 'custom' || v.personIds.length === 0) return;
    const total = parseAmount(v.amount) ?? 0;
    const sum = v.personIds.reduce((s, id) => s + (parseAmount(v.custom[id] ?? '') ?? 0), 0);
    if (sum !== total) {
      ctx.addIssue({ code: 'custom', path: ['splitMode'], message: 'La suma de las partes debe ser igual al total' });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ExpenseFormScreen() {
  const params = useLocalSearchParams<{ id?: string; accountId?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const presetAccountId = params.accountId ? Number(params.accountId) : undefined;
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const money = useMoney();

  const { data: expense, loading: expenseLoading, error: expenseError } = useExpense(id);
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: people } = usePeople();
  const { data: accounts, loading: accountsLoading } = useAccounts();

  const { control, handleSubmit, reset, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      title: '',
      categoryId: null,
      accountId: presetAccountId ?? null,
      date: todayISO(),
      isRecurring: false,
      note: '',
      splitMode: 'equal',
      personIds: [],
      custom: {},
    },
  });

  // Al editar, el skeleton se mantiene hasta que el formulario tiene los datos
  const [hydrated, setHydrated] = useState(!id);

  // Carga los datos al editar
  useEffect(() => {
    if (!expense) return;
    const amounts = expense.splits.map((s) => s.amountCents);
    const even = splitEvenly(expense.amountCents, amounts.length);
    const isEqual = amounts.every((a) => even.includes(a));
    reset({
      amount: centsToInput(expense.amountCents),
      title: expense.title,
      categoryId: expense.categoryId,
      accountId: expense.accountId,
      date: expense.date,
      isRecurring: expense.isRecurring,
      note: expense.note ?? '',
      splitMode: isEqual ? 'equal' : 'custom',
      personIds: expense.splits.map((s) => s.personId),
      custom: Object.fromEntries(expense.splits.map((s) => [String(s.personId), centsToInput(s.amountCents)])),
    });
    // Un render extra a propósito: el formulario se muestra recién cuando reset() ya lo llenó
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, [expense, reset]);

  // En un gasto nuevo, por defecto le corresponde a "Yo"
  const meId = people.find((p) => p.isMe)?.id;
  useEffect(() => {
    if (!id && meId) setValue('personIds', [meId]);
  }, [id, meId, setValue]);

  // En un gasto nuevo, sugiere la última cuenta usada
  const suggestedAccountId = useMemo(
    () => [...accounts].sort((a, b) => (b.lastExpenseId ?? 0) - (a.lastExpenseId ?? 0))[0]?.id,
    [accounts],
  );
  useEffect(() => {
    if (!id && !presetAccountId && !accountsLoading && suggestedAccountId) {
      setValue('accountId', suggestedAccountId);
    }
    // Solo al cargar las cuentas; después manda lo que elija el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, presetAccountId, accountsLoading]);

  const [amount, personIds, splitMode, custom, accountId] = useWatch({
    control,
    name: ['amount', 'personIds', 'splitMode', 'custom', 'accountId'],
  });
  const totalCents = parseAmount(amount) ?? 0;

  // Saldo que quedará en la cuenta elegida después de guardar
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const balanceAfter = selectedAccount
    ? selectedAccount.balance + (expense?.accountId === selectedAccount.id ? expense.amountCents : 0) - totalCents
    : 0;

  const equalParts = useMemo(() => splitEvenly(totalCents, personIds.length), [totalCents, personIds.length]);
  const customSum = personIds.reduce((s, pid) => s + (parseAmount(custom[pid] ?? '') ?? 0), 0);

  const togglePerson = (pid: number) => {
    haptic.selection();
    setValue('personIds', personIds.includes(pid) ? personIds.filter((p) => p !== pid) : [...personIds, pid], {
      shouldValidate: formState.isSubmitted,
    });
  };

  const onSubmit = handleSubmit(async (v) => {
    const total = parseAmount(v.amount)!;
    const parts = v.splitMode === 'equal' ? splitEvenly(total, v.personIds.length) : null;
    try {
      await saveExpense(
        {
          title: v.title,
          amountCents: total,
          date: v.date,
          categoryId: v.categoryId,
          accountId: v.accountId,
          note: v.note,
          isRecurring: v.isRecurring,
          splits: v.personIds.map((personId, i) => ({
            personId,
            amountCents: parts ? parts[i] : (parseAmount(v.custom[personId] ?? '') ?? 0),
          })),
        },
        id,
      );
    } catch {
      return; // mutate() ya avisó del error; el formulario queda abierto
    }
    haptic.success();
    goBack();
  });

  const onDelete = () =>
    confirm({
      title: 'Eliminar gasto',
      message: '¿Seguro que quieres eliminar este gasto?',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await deleteExpense(id!);
        haptic.warning();
        goBack();
      },
    });

  if (!hydrated)
    return (
      <FormPlaceholder
        title="Editar gasto"
        error={expenseError}
        missing={!expenseLoading && !expense}
        notFound="Este gasto ya no existe"
      />
    );

  return (
    <ModalFrame>
      <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalHeader
          title={id ? 'Editar gasto' : 'Nuevo gasto'}
          right={
            id ? (
              <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
            ) : null
          }
        />
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          {/* Monto */}
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <View className="items-center py-4">
                <Text className="text-sm text-muted">Monto total</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  autoFocus={!id}
                  className="min-w-40 text-center text-foreground"
                  style={[{ fontFamily: FONTS.extrabold, fontSize: 48 }, NO_OUTLINE]}
                />
                {totalCents > 0 && <Text className="text-sm text-muted">{money(totalCents)}</Text>}
                {fieldState.error && <Text className="mt-1 text-xs text-danger">{fieldState.error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <Input
                label="Descripción"
                placeholder="Ej: Arriendo, supermercado, Netflix…"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          {/* Categoría */}
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <View className="gap-2">
                <Text weight="medium" className="text-sm text-muted">
                  Categoría
                </Text>
                {categoriesLoading && (
                  <SkeletonPulse style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from({ length: 8 }, (_, i) => (
                      <View key={i} className="w-[23%] items-center gap-1.5 rounded-2xl bg-card py-3">
                        <SkeletonBadge size={36} />
                        <Skeleton className="h-2.5 w-12" />
                      </View>
                    ))}
                  </SkeletonPulse>
                )}
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((c) => {
                    const selected = field.value === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          haptic.selection();
                          field.onChange(selected ? null : c.id);
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
            )}
          />

          {/* Cuenta */}
          <Controller
            control={control}
            name="accountId"
            render={({ field }) => (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text weight="medium" className="text-sm text-muted">
                    ¿De dónde se descuenta?
                  </Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => router.push('/cuenta-form')}
                    className="flex-row items-center gap-1"
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text weight="semibold" className="text-sm text-primary">
                      Cuenta
                    </Text>
                  </Pressable>
                </View>
                {accountsLoading ? (
                  <SkeletonPulse style={{ flexDirection: 'row', gap: 8 }}>
                    {['w-32', 'w-28', 'w-24'].map((w) => (
                      <Skeleton key={w} className={cn('h-12 rounded-2xl', w)} />
                    ))}
                  </SkeletonPulse>
                ) : accounts.length === 0 ? (
                  <Pressable
                    onPress={() => router.push('/cuenta-form')}
                    className="rounded-2xl border border-dashed border-border bg-card px-4 py-3"
                  >
                    <Text className="text-sm text-muted">
                      Agrega una cuenta (banco, tarjeta o efectivo) para ver de dónde sale cada gasto.
                    </Text>
                  </Pressable>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-5"
                    contentContainerClassName="gap-2 px-5"
                  >
                    {accounts.map((a) => {
                      const selected = field.value === a.id;
                      return (
                        <Pressable
                          key={a.id}
                          onPress={() => {
                            haptic.selection();
                            field.onChange(selected ? null : a.id);
                          }}
                          className={cn(
                            'w-36 gap-2 rounded-2xl border p-3',
                            selected ? 'border-primary bg-primary-soft' : 'border-transparent bg-card',
                          )}
                        >
                          <AccountBadge type={a.type} color={a.color} size={32} />
                          <View>
                            <Text weight={selected ? 'semibold' : 'medium'} className="text-sm" numberOfLines={1}>
                              {a.name}
                            </Text>
                            <Text tabular className="text-xs text-muted" numberOfLines={1}>
                              {money(a.balance)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
                {selectedAccount && totalCents > 0 && (
                  <Text className={cn('text-xs', balanceAfter < 0 ? 'text-danger' : 'text-muted')}>
                    {balanceAfter < 0
                      ? selectedAccount.type === 'credit'
                        ? `Supera el cupo disponible por ${money(-balanceAfter)}`
                        : `Saldo insuficiente: quedará en ${money(balanceAfter)}`
                      : `Quedarán ${money(balanceAfter)} en ${selectedAccount.name}`}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DateField label="Fecha" value={field.value} onChange={(v) => field.onChange(v ?? todayISO())} />
            )}
          />

          {/* Reparto */}
          <View className="gap-3 rounded-3xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text weight="bold">¿A quién le corresponde?</Text>
                <Text className="text-xs text-muted">Elige una o varias personas</Text>
              </View>
              <IconButton
                icon={UserPlus}
                accessibilityLabel="Nueva persona"
                onPress={() => router.push('/persona-form')}
              />
            </View>

            <View className="flex-row flex-wrap gap-2">
              {people.map((p) => (
                <Chip
                  key={p.id}
                  label={p.isMe ? 'Yo' : p.name}
                  color={p.color}
                  selected={personIds.includes(p.id)}
                  left={<Avatar name={p.name} color={p.color} size={22} />}
                  onPress={() => togglePerson(p.id)}
                />
              ))}
            </View>

            {personIds.length > 1 && (
              <Controller
                control={control}
                name="splitMode"
                render={({ field }) => (
                  <Segmented
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'equal', label: 'Partes iguales' },
                      { value: 'custom', label: 'Montos a mano' },
                    ]}
                  />
                )}
              />
            )}

            {personIds.length > 0 && (
              <View className="gap-2">
                {personIds.map((pid, i) => {
                  const p = people.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <View key={pid} className="flex-row items-center gap-3 rounded-2xl bg-card-2 px-3 py-2">
                      <Avatar name={p.name} color={p.color} size={32} />
                      <Text weight="medium" className="flex-1">
                        {p.isMe ? 'Yo' : p.name}
                      </Text>
                      {splitMode === 'custom' && personIds.length > 1 ? (
                        <Controller
                          control={control}
                          name={`custom.${pid}`}
                          render={({ field }) => (
                            <TextInput
                              value={field.value ?? ''}
                              onChangeText={field.onChange}
                              placeholder="0"
                              placeholderTextColor={colors.muted}
                              keyboardType="decimal-pad"
                              className="h-10 w-28 rounded-xl bg-card px-3 text-right text-foreground"
                              style={[{ fontFamily: FONTS.semibold }, NO_OUTLINE]}
                            />
                          )}
                        />
                      ) : (
                        <Text weight="bold" tabular>
                          {money(personIds.length === 1 ? totalCents : (equalParts[i] ?? 0))}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {splitMode === 'custom' && personIds.length > 1 && (
                  <View className="flex-row items-center justify-between px-1">
                    <Text className="text-xs text-muted">Asignado</Text>
                    <Text
                      weight="semibold"
                      tabular
                      className={cn('text-xs', customSum === totalCents ? 'text-success' : 'text-warning')}
                    >
                      {money(customSum)} de {money(totalCents)}
                    </Text>
                  </View>
                )}
                {formState.errors.splitMode && (
                  <Text className="text-xs text-danger">{formState.errors.splitMode.message}</Text>
                )}
              </View>
            )}
          </View>

          <Controller
            control={control}
            name="isRecurring"
            render={({ field }) => (
              <View className="rounded-3xl border border-border bg-card px-4 py-2">
                <SwitchRow
                  icon={Repeat}
                  title="Gasto mensual"
                  description="Podrás copiarlo al mes siguiente con un toque"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Input
                label="Nota (opcional)"
                placeholder="Algún detalle"
                value={field.value}
                onChangeText={field.onChange}
                multiline
                className="h-auto min-h-13 py-3"
              />
            )}
          />
        </ScrollView>

        <View
          className="border-t border-border bg-background px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button
            title={id ? 'Guardar cambios' : 'Agregar gasto'}
            icon={Check}
            size="lg"
            loading={formState.isSubmitting}
            onPress={() => onSubmit()}
          />
        </View>
      </KeyboardAvoidingView>
    </ModalFrame>
  );
}
