import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

import { Text } from './text';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-row rounded-2xl bg-card-2 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              haptic.selection();
              onChange(o.value);
            }}
            className={cn('h-10 flex-1 items-center justify-center rounded-xl', active && 'bg-card shadow-sm')}
          >
            <Text
              weight={active ? 'semibold' : 'medium'}
              className={cn('text-sm', active ? 'text-foreground' : 'text-muted')}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
