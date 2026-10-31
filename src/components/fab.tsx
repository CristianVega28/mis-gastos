import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/haptics';
import { useIsDesktop } from '@/lib/layout';
import { useThemeColors } from '@/lib/theme';

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDesktop = useIsDesktop();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      className="absolute right-5 h-16 w-16 items-center justify-center rounded-full bg-primary active:scale-95"
      style={{
        bottom: isDesktop ? 32 : insets.bottom + 96,
        right: isDesktop ? 40 : 20,
        boxShadow: `0 10px 24px ${colors.primary}66`,
      }}
    >
      <Plus size={28} color={colors.onPrimary} strokeWidth={2.6} />
    </Pressable>
  );
}
