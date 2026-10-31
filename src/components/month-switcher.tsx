import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { monthKey, monthLabel } from '@/lib/dates';
import { useUI } from '@/store/ui';

import { IconButton } from './ui/button';
import { Text } from './ui/text';

export function MonthSwitcher() {
  const { month, shift, setMonth } = useUI();
  const isCurrent = month === monthKey();
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-card p-1.5">
      <IconButton icon={ChevronLeft} accessibilityLabel="Mes anterior" onPress={() => shift(-1)} />
      <Pressable onPress={() => setMonth(monthKey())} className="items-center">
        <Text weight="bold" className="text-base">
          {monthLabel(month)}
        </Text>
        {!isCurrent && <Text className="text-xs text-primary">Volver a este mes</Text>}
      </Pressable>
      <IconButton icon={ChevronRight} accessibilityLabel="Mes siguiente" onPress={() => shift(1)} />
    </View>
  );
}
