import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownLeft, Pencil, Plus, Receipt, X } from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AccountBadge } from '@/components/account-badge';
import { BackHeader } from '@/components/back-header';
import { DetailPlaceholder } from '@/components/detail-placeholder';
import { ModalFrame } from '@/components/modal-frame';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { addAccountDeposit, deleteAccountDeposit } from '@/db/mutations';
import { useAccountDetail, type AccountDetail } from '@/db/queries';
import type { AccountDeposit } from '@/db/types';
import { ACCOUNT_TYPES } from '@/lib/account-types';
import { cn } from '@/lib/cn';
import { monthLabel, shortDate } from '@/lib/dates';
import { confirm } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { parseAmount } from '@/lib/money';
import { useThemeColors } from '@/lib/theme';
import { useUI } from '@/store/ui';

type Movement = { key: string; date: string; /** + entra, − sale */ delta: number; balanceAfter: number } & (
  { kind: 'expense'; expense: AccountDetail['expenses'][number] } | { kind: 'deposit'; deposit: AccountDeposit }
);

/** Une gastos e ingresos en orden cronológico inverso, con el saldo que quedó después de cada uno. */
function buildMovements(detail: AccountDetail): Movement[] {
  const items = [
    ...detail.expenses.map((e) => ({
      kind: 'expense' as const,
      key: `e${e.id}`,
      date: e.date,
      delta: -e.amountCents,
      expense: e,
    })),
    ...detail.deposits.map((d) => ({
      kind: 'deposit' as const,
      key: `d${d.id}`,
      date: d.date,
      delta: d.amountCents,
      deposit: d,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  let balance = detail.account.balance;
  return items.map((m) => {
    const movement = { ...m, balanceAfter: balance };
    balance -= m.delta;
    return movement;
  });
}

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const month = useUI((s) => s.month);
  const money = useMoney();
  const colors = useThemeColors();
  const { data, error } = useAccountDetail(Number(id), month);
  const [deposit, setDeposit] = useState('');
  const movements = useMemo(() => (data ? buildMovements(data) : []), [data]);

  if (!data) return <DetailPlaceholder error={error} notFound="Esta cuenta ya no existe" />;
  const { account } = data;
  const info = ACCOUNT_TYPES[account.type];
  const depositCents = parseAmount(deposit) ?? 0;

  const onDeposit = async () => {
    if (depositCents <= 0) return;
    await addAccountDeposit(
      account.id,
      depositCents,
      undefined,
      account.type === 'credit' ? 'Pago de tarjeta' : undefined,
    );
    setDeposit('');
    haptic.success();
  };

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          title="Cuenta"
          right={
            <IconButton
              icon={Pencil}
              accessibilityLabel="Editar"
              onPress={() => router.push({ pathname: '/cuenta-form', params: { id: account.id } })}
            />
          }
        />

        <Card className="mt-2 items-center gap-3 py-6">
          <AccountBadge type={account.type} color={account.color} size={56} />
          <View className="items-center">
            <Text weight="extrabold" className="text-xl">
              {account.name}
            </Text>
            <Text className="text-sm text-muted">{info.label}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-muted">{info.balanceLabel}</Text>
            <Text
              weight="extrabold"
              tabular
              className={cn('text-4xl', account.balance < 0 && 'text-danger')}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {money(account.balance)}
            </Text>
          </View>
          <View className="rounded-full bg-card-2 px-3 py-1">
            <Text className="text-xs text-muted">
              Gastado en {monthLabel(month)}: {money(account.monthSpent)}
            </Text>
          </View>
        </Card>

        <View className="mt-4 gap-3">
          <Button
            title="Nuevo gasto desde esta cuenta"
            icon={Receipt}
            onPress={() => router.push({ pathname: '/gasto', params: { accountId: account.id } })}
          />
          <Card className="gap-2">
            <Text weight="semibold">{info.depositLabel}</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={deposit}
                onChangeText={setDeposit}
                placeholder="Monto"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                className="h-12 flex-1 rounded-2xl bg-card-2 px-4 text-base text-foreground"
                style={[{ fontFamily: FONTS.semibold }, NO_OUTLINE]}
                onSubmitEditing={onDeposit}
              />
              <Button title="Sumar" icon={Plus} variant="success" onPress={onDeposit} disabled={depositCents <= 0} />
            </View>
          </Card>
        </View>

        <SectionTitle title={`Movimientos (${movements.length})`} />
        {movements.length === 0 ? (
          <Card>
            <EmptyState
              icon={Receipt}
              title="Sin movimientos"
              description="Los gastos que cargues a esta cuenta aparecerán aquí, descontados del saldo."
            />
          </Card>
        ) : (
          <Card className="gap-1 px-2 py-2">
            {movements.map((m, i) => {
              const monthKey = m.date.slice(0, 7);
              const newMonth = i === 0 || movements[i - 1].date.slice(0, 7) !== monthKey;
              return (
                <Fragment key={m.key}>
                  {newMonth && (
                    <Text weight="semibold" className="px-2 pb-1 pt-2 text-xs uppercase tracking-wider text-muted">
                      {monthLabel(monthKey)}
                    </Text>
                  )}
                  {m.kind === 'expense' ? (
                    <Pressable
                      onPress={() => router.push({ pathname: '/gasto', params: { id: m.expense.id } })}
                      className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-card-2"
                    >
                      <IconBadge
                        icon={m.expense.category?.icon ?? null}
                        color={m.expense.category?.color ?? '#64748B'}
                        size={40}
                      />
                      <View className="flex-1">
                        <Text weight="semibold" numberOfLines={1}>
                          {m.expense.title}
                        </Text>
                        <Text className="text-xs text-muted" numberOfLines={1}>
                          {shortDate(m.date)} · {m.expense.category?.name ?? 'Sin categoría'}
                        </Text>
                      </View>
                      <MovementAmount delta={m.delta} balanceAfter={m.balanceAfter} />
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center gap-3 px-2 py-2.5">
                      <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-success-soft">
                        <ArrowDownLeft size={19} color={colors.success} strokeWidth={2.4} />
                      </View>
                      <View className="flex-1">
                        <Text weight="semibold" numberOfLines={1}>
                          {m.deposit.note ?? 'Ingreso'}
                        </Text>
                        <Text className="text-xs text-muted">{shortDate(m.date)}</Text>
                      </View>
                      <MovementAmount delta={m.delta} balanceAfter={m.balanceAfter} />
                      <Pressable
                        hitSlop={10}
                        accessibilityLabel="Eliminar ingreso"
                        onPress={() =>
                          confirm({
                            title: 'Eliminar ingreso',
                            message: `¿Eliminar el ingreso de ${money(m.delta)}?`,
                            confirmText: 'Eliminar',
                            destructive: true,
                            onConfirm: () => deleteAccountDeposit(m.deposit.id),
                          })
                        }
                      >
                        <X size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  )}
                </Fragment>
              );
            })}
          </Card>
        )}
      </Screen>
    </ModalFrame>
  );
}

function MovementAmount({ delta, balanceAfter }: { delta: number; balanceAfter: number }) {
  const money = useMoney();
  return (
    <View className="items-end gap-0.5">
      <Text weight="bold" tabular className={cn(delta > 0 && 'text-success')}>
        {delta > 0 ? '+' : '−'}
        {money(Math.abs(delta))}
      </Text>
      <Text tabular className={cn('text-[11px]', balanceAfter < 0 ? 'text-danger' : 'text-muted')}>
        Saldo {money(balanceAfter)}
      </Text>
    </View>
  );
}
