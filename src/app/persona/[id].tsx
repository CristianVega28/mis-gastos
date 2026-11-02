import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCheck, Circle, CircleCheck, HandCoins, Pencil, Receipt, Share2, Trash2 } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { DetailPlaceholder } from '@/components/detail-placeholder';
import { ModalFrame } from '@/components/modal-frame';
import { BackHeader } from '@/components/back-header';
import { DebtCard } from '@/components/debt-card';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { deletePerson, markAllSplitsPaid, setSplitPaid } from '@/db/mutations';
import { usePersonDetail } from '@/db/queries';
import { cn } from '@/lib/cn';
import { shortDate, todayISO } from '@/lib/dates';
import { confirm, notify } from '@/lib/dialogs';
import { useMoney } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';
import { goBack } from '@/lib/navigation';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const money = useMoney();
  const colors = useThemeColors();
  const { data, error } = usePersonDetail(personId);
  const [tab, setTab] = useState<'splits' | 'debts'>('splits');
  const summaryRef = useRef<ComponentRef<typeof View>>(null);

  if (!data) return <DetailPlaceholder error={error} notFound="Esta persona ya no existe" />;
  const { person, splits, debts } = data;

  const pendingSplits = person.isMe ? 0 : splits.filter((s) => !s.paid).reduce((s, x) => s + x.amountCents, 0);
  const owesMe = debts
    .filter((d) => d.direction === 'owed_to_me')
    .reduce((s, d) => s + Math.max(d.amountCents - d.paidCents, 0), 0);
  const iOwe = debts
    .filter((d) => d.direction === 'i_owe')
    .reduce((s, d) => s + Math.max(d.amountCents - d.paidCents, 0), 0);
  const net = pendingSplits + owesMe - iOwe;

  const shareSummary = async () => {
    try {
      const uri = await captureRef(summaryRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Resumen de ${person.name}` });
    } catch (e) {
      notify('No se pudo compartir', e instanceof Error ? e.message : undefined);
    }
  };

  const onDelete = () =>
    confirm({
      title: `Eliminar a ${person.name}`,
      message: 'También se eliminarán sus partes en los gastos y sus deudas.',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await deletePerson(person.id);
        haptic.warning();
        goBack();
      },
    });

  const onSettleAll = () =>
    confirm({
      title: 'Marcar todo como pagado',
      message: `${person.name} te pagó ${money(pendingSplits)} en gastos.`,
      confirmText: 'Marcar pagado',
      onConfirm: async () => {
        await markAllSplitsPaid(person.id);
        haptic.success();
      },
    });

  const pendingList = splits.filter((s) => !s.paid);

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          right={
            <>
              {Platform.OS !== 'web' && !person.isMe && (
                <IconButton icon={Share2} accessibilityLabel="Compartir resumen" onPress={shareSummary} />
              )}
              <IconButton
                icon={Pencil}
                accessibilityLabel="Editar"
                onPress={() => router.push({ pathname: '/persona-form', params: { id: person.id } })}
              />
              {!person.isMe && (
                <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
              )}
            </>
          }
        />

        {/* Resumen que se captura como imagen para compartir */}
        <View ref={summaryRef} collapsable={false} className="mt-2 rounded-[32px] bg-background">
          <Card className="items-center gap-3 py-6">
            <Avatar name={person.name} color={person.color} size={72} />
            <View className="items-center">
              <Text weight="extrabold" className="text-2xl">
                {person.name}
              </Text>
              {person.phone && <Text className="text-sm text-muted">{person.phone}</Text>}
            </View>
            {!person.isMe && (
              <>
                <View
                  className={cn(
                    'rounded-full px-4 py-1.5',
                    net > 0 ? 'bg-success-soft' : net < 0 ? 'bg-danger-soft' : 'bg-card-2',
                  )}
                >
                  <Text
                    weight="bold"
                    tabular
                    className={cn(net > 0 ? 'text-success' : net < 0 ? 'text-danger' : 'text-muted')}
                  >
                    {net > 0 ? `Te debe ${money(net)}` : net < 0 ? `Le debes ${money(-net)}` : 'Están a mano ✓'}
                  </Text>
                </View>
                <View className="w-full flex-row gap-2 px-2">
                  <View className="flex-1 items-center rounded-2xl bg-card-2 py-3">
                    <Text className="text-xs text-muted">Gastos</Text>
                    <Text weight="bold" tabular>
                      {money(pendingSplits)}
                    </Text>
                  </View>
                  <View className="flex-1 items-center rounded-2xl bg-card-2 py-3">
                    <Text className="text-xs text-muted">Préstamos</Text>
                    <Text weight="bold" tabular>
                      {money(owesMe)}
                    </Text>
                  </View>
                  <View className="flex-1 items-center rounded-2xl bg-card-2 py-3">
                    <Text className="text-xs text-muted">Le debes</Text>
                    <Text weight="bold" tabular>
                      {money(iOwe)}
                    </Text>
                  </View>
                </View>
                {pendingList.length > 0 && (
                  <View className="w-full gap-1 px-2">
                    {pendingList.slice(0, 6).map((s) => (
                      <View key={s.id} className="flex-row justify-between">
                        <Text className="text-xs text-muted" numberOfLines={1}>
                          {s.title} · {shortDate(s.date)}
                        </Text>
                        <Text weight="semibold" tabular className="text-xs">
                          {money(s.amountCents)}
                        </Text>
                      </View>
                    ))}
                    {pendingList.length > 6 && (
                      <Text className="text-xs text-muted">y {pendingList.length - 6} más…</Text>
                    )}
                  </View>
                )}
                <Text className="text-[10px] text-muted">Mis Gastos · {shortDate(todayISO())}</Text>
              </>
            )}
          </Card>
        </View>

        <Segmented
          className="mt-5"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'splits', label: `Gastos (${splits.length})` },
            { value: 'debts', label: `Deudas (${debts.length})` },
          ]}
        />

        {tab === 'splits' ? (
          <View className="mt-4 gap-3">
            {pendingSplits > 0 && (
              <Button title="Marcar todo como pagado" icon={CheckCheck} variant="success" onPress={onSettleAll} />
            )}
            {splits.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Receipt}
                  title="Sin gastos asignados"
                  description="Asigna gastos a esta persona al crearlos."
                />
              </Card>
            ) : (
              <Card className="gap-1 px-2 py-2">
                {splits.map((s) => (
                  <View key={s.id} className="flex-row items-center gap-3 px-2 py-2.5">
                    <IconBadge icon={s.categoryIcon} color={s.categoryColor ?? '#64748B'} size={40} />
                    <Pressable
                      className="flex-1"
                      onPress={() => router.push({ pathname: '/gasto', params: { id: s.expenseId } })}
                    >
                      <Text weight="semibold" numberOfLines={1} className={cn(s.paid && 'text-muted line-through')}>
                        {s.title}
                      </Text>
                      <Text className="text-xs text-muted">
                        {shortDate(s.date)}
                        {s.amountCents !== s.totalCents && ` · de ${money(s.totalCents)}`}
                      </Text>
                    </Pressable>
                    <Text weight="bold" tabular className={cn(s.paid && 'text-muted')}>
                      {money(s.amountCents)}
                    </Text>
                    {!person.isMe && (
                      <Pressable
                        hitSlop={10}
                        accessibilityLabel={s.paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                        onPress={() => {
                          haptic.selection();
                          setSplitPaid(s.id, !s.paid).catch(() => {});
                        }}
                      >
                        {s.paid ? (
                          <CircleCheck size={24} color={colors.success} />
                        ) : (
                          <Circle size={24} color={colors.muted} />
                        )}
                      </Pressable>
                    )}
                  </View>
                ))}
              </Card>
            )}
          </View>
        ) : (
          <View className="mt-4 gap-3">
            {!person.isMe && (
              <Button
                title="Nueva deuda"
                icon={HandCoins}
                variant="secondary"
                onPress={() => router.push({ pathname: '/deuda-form', params: { personId: person.id } })}
              />
            )}
            {debts.length === 0 ? (
              <Card>
                <EmptyState icon={HandCoins} title="Sin deudas" description="Registra préstamos y sus abonos." />
              </Card>
            ) : (
              debts.map((d) => <DebtCard key={d.id} debt={d} />)
            )}
          </View>
        )}
      </Screen>
    </ModalFrame>
  );
}
