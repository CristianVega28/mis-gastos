import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { withAlpha } from '@/lib/palette';

import { Text } from './text';

export function Chip({
  label,
  selected,
  onPress,
  color,
  left,
  className,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Color de acento cuando está seleccionado (por defecto, primary) */
  color?: string;
  left?: React.ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      className={cn(
        'h-10 flex-row items-center gap-2 rounded-full border px-4 active:opacity-80',
        selected && !color && 'border-primary bg-primary-soft',
        !selected && 'border-border bg-card',
        className,
      )}
      style={selected && color ? { borderColor: color, backgroundColor: withAlpha(color, 0.15) } : undefined}
    >
      {left}
      <Text
        weight={selected ? 'semibold' : 'medium'}
        className={cn('text-sm', selected ? (color ? '' : 'text-primary') : 'text-foreground')}
        style={selected && color ? { color } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}
