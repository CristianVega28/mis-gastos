import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { HandCoins, House, Receipt, Settings, Users, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';

import { Text } from './ui/text';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  gastos: Receipt,
  personas: Users,
  deudas: HandCoins,
  ajustes: Settings,
};

/** Tab bar flotante con efecto vidrio. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { theme } = useUniwind();

  return (
    <View className="absolute left-4 right-4" style={{ bottom: Math.max(insets.bottom, 12) }} pointerEvents="box-none">
      <View
        className="overflow-hidden rounded-[28px] border border-border"
        style={[
          { boxShadow: '0 12px 32px rgba(0,0,0,0.18)' },
          // Vidrio: BlurView en iOS, backdrop-filter en web, sólido en Android
          Platform.OS === 'android' && { backgroundColor: colors.card },
          Platform.OS === 'web' && ({ backgroundColor: `${colors.card}CC`, backdropFilter: 'blur(20px)' } as object),
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={60}
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={{ position: 'absolute', inset: 0, backgroundColor: `${colors.card}99` }}
          />
        )}
        <View className="flex-row px-2 py-2">
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const Icon = ICONS[route.name] ?? House;
            const label = options.title ?? route.name;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => {
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    haptic.selection();
                    navigateToTab(route.key);
                  }
                }}
                className="flex-1 items-center gap-1 py-1.5"
              >
                <View className={cn('h-8 w-12 items-center justify-center rounded-full', focused && 'bg-primary-soft')}>
                  <Icon size={21} color={focused ? colors.primary : colors.muted} strokeWidth={focused ? 2.4 : 2} />
                </View>
                <Text
                  weight={focused ? 'semibold' : 'medium'}
                  className={cn('text-[11px]', focused ? 'text-primary' : 'text-muted')}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
