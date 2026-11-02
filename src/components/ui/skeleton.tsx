import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/cn';

import { Card } from './card';

/**
 * Hace "latir" todo lo que contiene mientras se cargan los datos. Un solo pulso
 * por bloque (no uno por cada barra) para que todo palpite a la vez y cueste poco.
 * Respeta la opción de reducir movimiento del sistema (Reanimated lo hace solo).
 */
export function SkeletonPulse({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
      style={[animated, style]}
    >
      {children}
    </Animated.View>
  );
}

/** Bloque gris que ocupa el lugar de un texto, ícono o imagen mientras carga. */
export function Skeleton({ className, style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  return <View className={cn('rounded-lg bg-border', className)} style={style} />;
}

/** Círculo (avatar) o cuadrado redondeado (ícono de categoría o cuenta). */
export function SkeletonBadge({ size = 44, round = false }: { size?: number; round?: boolean }) {
  return (
    <Skeleton
      className="rounded-none"
      style={{ width: size, height: size, borderRadius: round ? size / 2 : size * 0.34 }}
    />
  );
}

// Anchos que varían entre filas para que no se vea como una grilla rígida
const TITLE_WIDTHS = ['w-32', 'w-24', 'w-40', 'w-28', 'w-36', 'w-20'];
const SUB_WIDTHS = ['w-20', 'w-28', 'w-16', 'w-24', 'w-20', 'w-32'];

/** Fila con ícono, dos líneas de texto y un monto, como las filas de gastos o cuentas. */
export function SkeletonRow({ index = 0, round = false, badge = 44 }: { index?: number; round?: boolean; badge?: number }) {
  return (
    <View className="flex-row items-center gap-3 px-2 py-2.5">
      <SkeletonBadge size={badge} round={round} />
      <View className="flex-1 gap-2">
        <Skeleton className={cn('h-3.5', TITLE_WIDTHS[index % TITLE_WIDTHS.length])} />
        <Skeleton className={cn('h-2.5', SUB_WIDTHS[index % SUB_WIDTHS.length])} />
      </View>
      <Skeleton className="h-3.5 w-16" />
    </View>
  );
}

/** Tarjeta con varias filas, como la lista de cuentas, categorías o gastos recientes. */
export function SkeletonRowsCard({
  count = 4,
  round,
  badge,
  className,
}: {
  count?: number;
  round?: boolean;
  badge?: number;
  className?: string;
}) {
  return (
    <Card className={cn('gap-1 px-2 py-2', className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} index={i} round={round} badge={badge} />
      ))}
    </Card>
  );
}
