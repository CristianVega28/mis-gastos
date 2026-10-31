import type { LucideIcon } from 'lucide-react-native';
import { Switch, View } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Text } from './text';

export function SwitchRow({
  icon: Icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 py-2">
      {Icon && (
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-card-2">
          <Icon size={20} color={colors.foreground} strokeWidth={2} />
        </View>
      )}
      <View className="flex-1">
        <Text weight="semibold">{title}</Text>
        {description && <Text className="text-xs text-muted">{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
