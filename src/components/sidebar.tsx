import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import {
  HandCoins,
  House,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme';

import { Button } from './ui/button';
import { Text } from './ui/text';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  gastos: Receipt,
  personas: Users,
  deudas: HandCoins,
  ajustes: Settings,
};

/** Navegación lateral de la vista web de escritorio. */
export function Sidebar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const colors = useThemeColors();

  return (
    <View className="h-full w-64 justify-between border-r border-border bg-card px-4 py-6">
      <View className="gap-8">
        <View className="flex-row items-center gap-3 px-2">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
            <Wallet size={22} color={colors.onPrimary} strokeWidth={2.2} />
          </View>
          <Text weight="extrabold" className="text-xl tracking-tight">
            Mis Gastos
          </Text>
        </View>

        <Button title="Nuevo gasto" icon={Plus} onPress={() => router.push('/gasto')} />

        <View className="gap-1">
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const Icon = ICONS[route.name] ?? House;
            const label = descriptors[route.key].options.title ?? route.name;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigateToTab(route.key);
                }}
                className={cn(
                  'h-11 flex-row items-center gap-3 rounded-2xl px-3',
                  focused ? 'bg-primary-soft' : 'hover:bg-card-2',
                )}
              >
                <Icon size={20} color={focused ? colors.primary : colors.muted} strokeWidth={focused ? 2.4 : 2} />
                <Text weight={focused ? 'semibold' : 'medium'} className={focused ? 'text-primary' : 'text-foreground'}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row items-center gap-2 rounded-2xl bg-card-2 p-3">
        <ShieldCheck size={18} color={colors.success} />
        <Text className="flex-1 text-xs text-muted">Tus datos se sincronizan en todos tus dispositivos</Text>
      </View>
    </View>
  );
}
