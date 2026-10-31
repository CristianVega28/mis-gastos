import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { monthLabel } from '@/lib/dates';

/** Barras de los últimos meses; resalta el mes seleccionado. */
export function MonthBars({
  data,
  selected,
  format,
  height = 120,
}: {
  data: { month: string; total: number }[];
  selected: string;
  format: (cents: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <View className="flex-row items-end justify-between gap-2" style={{ height: height + 44 }}>
      {data.map((d, i) => {
        const active = d.month === selected;
        const h = Math.max((d.total / max) * height, 6);
        return (
          <View key={d.month} className="flex-1 items-center gap-1.5">
            <Text
              weight="semibold"
              className={cn('text-[10px]', active ? 'text-primary' : 'text-muted')}
              numberOfLines={1}
            >
              {d.total > 0 ? format(d.total) : ''}
            </Text>
            <Animated.View entering={FadeInUp.delay(i * 50).springify()} style={{ width: '100%', height: h }}>
              <View className={cn('h-full w-full rounded-xl', active ? 'bg-primary' : 'bg-card-2')} />
            </Animated.View>
            <Text
              weight={active ? 'bold' : 'medium'}
              className={cn('text-xs', active ? 'text-foreground' : 'text-muted')}
            >
              {monthLabel(d.month, { short: true })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
