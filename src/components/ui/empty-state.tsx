import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Button } from './button';
import { Text } from './text';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-3 px-8 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft">
        <Icon size={28} color={colors.primary} strokeWidth={2} />
      </View>
      <Text weight="bold" className="text-center text-lg">
        {title}
      </Text>
      {description && <Text className="text-center text-sm text-muted">{description}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} size="sm" onPress={onAction} className="mt-2" />}
    </View>
  );
}
