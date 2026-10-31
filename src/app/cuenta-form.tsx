import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountBadge } from '@/components/account-badge';
import { ColorPicker } from '@/components/forms/color-picker';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { deleteAccount, saveAccount } from '@/db/mutations';
import { useAccounts, type AccountSummary } from '@/db/queries';
import type { AccountType } from '@/db/types';
import { ACCOUNT_TYPE_KEYS, ACCOUNT_TYPES } from '@/lib/account-types';
import { cn } from '@/lib/cn';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { centsToInput, parseAmount } from '@/lib/money';
import { PALETTE } from '@/lib/palette';
import { useThemeColors } from '@/lib/theme';

export default function AccountFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const { data: accounts, loading } = useAccounts();
  const account = id ? accounts.find((a) => a.id === id) : undefined;

  // Al editar, espera a tener la cuenta para inicializar el formulario
  if (id && (loading || !account)) return <View className="flex-1 bg-background" />;
  return (
    <ModalFrame>
      <AccountForm key={account?.id ?? 'new'} id={id} initial={account} />
    </ModalFrame>
  );
}

function AccountForm({ id, initial }: { id?: number; initial?: AccountSummary }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const money = useMoney();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'debit');
  const [color, setColor] = useState<string>(initial?.color ?? PALETTE[2]);
  // Se pide el saldo de hoy; el saldo inicial se ajusta para que calce.
  const [balance, setBalance] = useState(initial ? centsToInput(initial.balance) : '');
  const [error, setError] = useState<string>();
  const info = ACCOUNT_TYPES[type];

  const onSave = async () => {
    if (!name.trim()) {
      setError('Escribe un nombre');
      return;
    }
    const balanceCents = parseAmount(balance) ?? 0;
    const initialBalanceCents = initial ? initial.initialBalanceCents + (balanceCents - initial.balance) : balanceCents;
    await saveAccount({ name, type, color, initialBalanceCents }, id);
    haptic.success();
    router.back();
  };

  const onDelete = () =>
    confirm({
      title: 'Eliminar cuenta',
      message: 'Sus gastos se conservarán sin cuenta y se borrarán sus ingresos.',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await deleteAccount(id!);
        haptic.warning();
        router.dismissTo('/cuentas');
      },
    });

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader
        title={id ? 'Editar cuenta' : 'Nueva cuenta'}
        right={
          id ? (
            <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
          ) : null
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <View className="items-center py-4">
          <AccountBadge type={type} color={color} size={80} />
        </View>
        <Input
          label="Nombre"
          placeholder="Ej: Cuenta RUT, Visa, Billetera"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(undefined);
          }}
          error={error}
        />
        <View className="gap-2">
          <Text weight="medium" className="text-sm text-muted">
            Tipo
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPE_KEYS.map((key) => {
              const Icon = ACCOUNT_TYPES[key].icon;
              const selected = type === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    haptic.selection();
                    setType(key);
                  }}
                  className={cn(
                    'w-[48%] flex-row items-center gap-2 rounded-2xl border px-3 py-3',
                    selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
                  )}
                >
                  <Icon size={20} color={selected ? colors.primary : colors.foreground} />
                  <Text weight={selected ? 'semibold' : 'medium'} className="flex-1 text-sm" numberOfLines={1}>
                    {ACCOUNT_TYPES[key].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View className="gap-1.5">
          <Input
            label={info.initialLabel}
            placeholder="0"
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
          />
          <Text className="text-xs text-muted">
            {id
              ? `Si no calza con tu banco, corrígelo aquí. Hoy la app calcula ${money(initial?.balance ?? 0)}.`
              : 'Desde aquí se irán descontando los gastos que cargues a esta cuenta.'}
          </Text>
        </View>
        <View className="gap-2">
          <Text weight="medium" className="text-sm text-muted">
            Color
          </Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>
      </ScrollView>
      <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button title={id ? 'Guardar cambios' : 'Crear cuenta'} icon={Check} size="lg" onPress={onSave} />
      </View>
    </KeyboardAvoidingView>
  );
}
