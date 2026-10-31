import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { withAlpha } from '@/lib/palette';

import { Text } from './text';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Avatar({
  name,
  color,
  size = 44,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: withAlpha(color, 0.18) }}
    >
      <Text weight="bold" style={{ color, fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
