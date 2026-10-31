import { Pressable, View } from 'react-native';

import { Text } from './text';

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <Text weight="bold" className="text-lg">
        {title}
      </Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text weight="semibold" className="text-sm text-primary">
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
