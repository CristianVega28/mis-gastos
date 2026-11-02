import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';

import { IconButton } from './ui/button';
import { Text } from './ui/text';
import { goBack } from '@/lib/navigation';

export function BackHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2">
      <IconButton icon={ChevronLeft} accessibilityLabel="Volver" onPress={() => goBack()} />
      {title ? (
        <Text weight="bold" className="flex-1 text-center text-lg" numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}
      <View className="min-w-10 flex-row items-center justify-end gap-2">{right}</View>
    </View>
  );
}
