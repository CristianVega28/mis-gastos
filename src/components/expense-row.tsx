import { router } from 'expo-router';
import { Repeat } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { ExpenseWithRelations } from '@/db/queries';
import { useMoney } from '@/lib/format';
import { useThemeColors } from '@/lib/theme';

import { Avatar } from './ui/avatar';
import { IconBadge } from './ui/icon-badge';
import { Text } from './ui/text';

export function ExpenseRow({ expense }: { expense: ExpenseWithRelations }) {
  const money = useMoney();
  const colors = useThemeColors();
  const others = expense.splits.filter((s) => !s.person.isMe);
  const pending = others.filter((s) => !s.paid).reduce((sum, s) => sum + s.amountCents, 0);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/gasto', params: { id: expense.id } })}
      className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-card-2"
    >
      <IconBadge icon={expense.category?.icon ?? null} color={expense.category?.color ?? '#64748B'} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text weight="semibold" numberOfLines={1} className="shrink">
            {expense.title}
          </Text>
          {expense.isRecurring && <Repeat size={13} color={colors.muted} />}
        </View>
        <View className="flex-row items-center gap-1.5">
          {expense.splits.length > 0 ? (
            <>
              <View className="flex-row">
                {expense.splits.slice(0, 3).map((s, i) => (
                  <View
                    key={s.id}
                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                    className="rounded-full border-2 border-card"
                  >
                    <Avatar name={s.person.name} color={s.person.color} size={18} />
                  </View>
                ))}
              </View>
              <Text className="text-xs text-muted" numberOfLines={1}>
                {expense.splits.length === 1 ? expense.splits[0].person.name : `${expense.splits.length} personas`}
              </Text>
            </>
          ) : (
            <Text className="text-xs text-muted">{expense.category?.name ?? 'Sin categoría'}</Text>
          )}
          {expense.account && (
            <Text className="shrink text-xs text-muted" numberOfLines={1}>
              · {expense.account.name}
            </Text>
          )}
        </View>
      </View>
      <View className="items-end gap-0.5">
        <Text weight="bold" tabular>
          {money(expense.amountCents)}
        </Text>
        {pending > 0 && (
          <Text weight="medium" tabular className="text-[11px] text-warning">
            Por cobrar {money(pending)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
