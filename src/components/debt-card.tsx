import { router } from 'expo-router';
import { CalendarClock, CheckCircle2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { DebtRow } from '@/db/queries';
import { cn } from '@/lib/cn';
import { daysUntil, shortDate } from '@/lib/dates';
import { useMoney } from '@/lib/format';
import { useThemeColors } from '@/lib/theme';

import { Avatar } from './ui/avatar';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Text } from './ui/text';

function dueLabel(dueDate: string) {
  const d = daysUntil(dueDate);
  if (d < 0) return { text: `Venció hace ${-d} ${d === -1 ? 'día' : 'días'}`, tone: 'danger' as const };
  if (d === 0) return { text: 'Vence hoy', tone: 'warning' as const };
  if (d <= 7) return { text: `Vence en ${d} ${d === 1 ? 'día' : 'días'}`, tone: 'warning' as const };
  return { text: `Vence el ${shortDate(dueDate)}`, tone: 'muted' as const };
}

export function DebtCard({ debt, person }: { debt: DebtRow; person?: { name: string; color: string } }) {
  const money = useMoney();
  const colors = useThemeColors();
  const remaining = Math.max(debt.amountCents - debt.paidCents, 0);
  const settled = remaining === 0;
  const progress = debt.amountCents > 0 ? debt.paidCents / debt.amountCents : 0;
  const owedToMe = debt.direction === 'owed_to_me';
  const due = debt.dueDate && !settled ? dueLabel(debt.dueDate) : null;

  return (
    <Pressable onPress={() => router.push(`/deuda/${debt.id}`)} className="active:opacity-80">
      <Card className={cn('gap-3', settled && 'opacity-60')}>
        <View className="flex-row items-center gap-3">
          {person && <Avatar name={person.name} color={person.color} size={40} />}
          <View className="flex-1">
            <Text weight="semibold" numberOfLines={1}>
              {debt.description}
            </Text>
            <Text className="text-xs text-muted" numberOfLines={1}>
              {person
                ? owedToMe
                  ? `${person.name} te debe`
                  : `Le debes a ${person.name}`
                : owedToMe
                  ? 'Te debe'
                  : 'Le debes'}
              {' · '}
              {shortDate(debt.date)}
            </Text>
          </View>
          {settled ? (
            <CheckCircle2 size={22} color={colors.success} />
          ) : (
            <View className="items-end">
              <Text weight="bold" tabular className={owedToMe ? 'text-success' : 'text-danger'}>
                {money(remaining)}
              </Text>
              {debt.paidCents > 0 && (
                <Text tabular className="text-[11px] text-muted">
                  de {money(debt.amountCents)}
                </Text>
              )}
            </View>
          )}
        </View>
        {!settled && debt.paidCents > 0 && (
          <Progress value={progress} color={owedToMe ? colors.success : colors.danger} height={6} />
        )}
        {due && (
          <View className="flex-row items-center gap-1.5">
            <CalendarClock
              size={14}
              color={due.tone === 'danger' ? colors.danger : due.tone === 'warning' ? colors.warning : colors.muted}
            />
            <Text
              weight="medium"
              className={cn(
                'text-xs',
                due.tone === 'danger' && 'text-danger',
                due.tone === 'warning' && 'text-warning',
                due.tone === 'muted' && 'text-muted',
              )}
            >
              {due.text}
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
