import { X } from 'lucide-react-native';
import { View } from 'react-native';

import { IconButton } from './ui/button';
import { Text } from './ui/text';
import { goBack } from '@/lib/navigation';

export function ModalHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
      <IconButton icon={X} accessibilityLabel="Cerrar" onPress={() => goBack()} />
      <Text weight="bold" className="text-lg">
        {title}
      </Text>
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
