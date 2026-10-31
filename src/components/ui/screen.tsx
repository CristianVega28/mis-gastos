import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { useIsDesktop } from '@/lib/layout';

import { useInModal } from '../modal-frame';

import { Text } from './text';

/** Espacio inferior para que el contenido no quede bajo la tab bar flotante. */
export const TAB_BAR_SPACE = 120;

export function Screen({
  children,
  scroll = true,
  className,
  contentClassName,
  ...props
}: ScrollViewProps & { scroll?: boolean; className?: string; contentClassName?: string }) {
  const insets = useSafeAreaInsets();
  const inModal = useInModal();
  const isDesktop = useIsDesktop() && !inModal;
  if (!scroll) {
    return (
      <View className={cn('flex-1 bg-background', className)} style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      className={cn('flex-1 bg-background', className)}
      contentContainerClassName={cn('px-5', isDesktop && 'w-full max-w-[1120px] self-center px-10', contentClassName)}
      contentContainerStyle={{
        paddingTop: isDesktop ? 32 : insets.top + 8,
        paddingBottom: isDesktop ? 48 : TAB_BAR_SPACE,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between pt-2">
      <View className="flex-1">
        {subtitle && <Text className="text-sm text-muted">{subtitle}</Text>}
        <Text weight="extrabold" className="text-3xl tracking-tight">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
