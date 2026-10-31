import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const containers: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-card-2 border border-border',
  ghost: 'bg-transparent',
  danger: 'bg-danger-soft',
  success: 'bg-success-soft',
};

const labels: Record<Variant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-foreground',
  ghost: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
};

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  className,
  onPress,
  ...props
}: Props) {
  const colors = useThemeColors();
  const iconColor = {
    primary: colors.onPrimary,
    secondary: colors.foreground,
    ghost: colors.primary,
    danger: colors.danger,
    success: colors.success,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={(e) => {
        haptic.light();
        onPress?.(e);
      }}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80',
        size === 'sm' && 'h-9 px-3',
        size === 'md' && 'h-12 px-5',
        size === 'lg' && 'h-14 px-6',
        containers[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        Icon && <Icon size={size === 'sm' ? 16 : 18} color={iconColor} strokeWidth={2.2} />
      )}
      <Text weight="semibold" className={cn(labels[variant], size === 'sm' ? 'text-sm' : 'text-base')}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  onPress,
  className,
  color,
  size = 20,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  className?: string;
  color?: string;
  size?: number;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      className={cn('h-10 w-10 items-center justify-center rounded-full bg-card-2 active:opacity-70', className)}
    >
      <Icon size={size} color={color ?? colors.foreground} strokeWidth={2.2} />
    </Pressable>
  );
}
