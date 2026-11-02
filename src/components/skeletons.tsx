import { View } from 'react-native';

import { useIsDesktop } from '@/lib/layout';
import { cn } from '@/lib/cn';

import { ModalFrame } from './modal-frame';
import { ModalHeader } from './modal-header';
import { Card } from './ui/card';
import { SectionTitle } from './ui/section-title';
import { Skeleton, SkeletonBadge, SkeletonPulse, SkeletonRow, SkeletonRowsCard } from './ui/skeleton';

/** Detalle de persona, deuda o cuenta: tarjeta de resumen centrada y una lista. */
export function DetailSkeleton() {
  return (
    <SkeletonPulse>
      <Card className="mt-2 items-center gap-3 py-6">
        <SkeletonBadge size={64} round />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </Card>
      <Skeleton className="mt-4 h-11 w-full rounded-2xl" />
      <SkeletonRowsCard className="mt-4" count={4} />
    </SkeletonPulse>
  );
}

/** Lista de tarjetas con avatar (personas, deudas). En escritorio, en dos columnas. */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  const isDesktop = useIsDesktop();
  return (
    <SkeletonPulse>
      <View className={isDesktop ? 'flex-row flex-wrap justify-between gap-y-3' : 'gap-3'}>
        {Array.from({ length: count }, (_, i) => (
          <Card
            key={i}
            className="flex-row items-center gap-3"
            style={isDesktop ? { width: '49.2%' } : undefined}
          >
            <SkeletonBadge size={48} round />
            <View className="flex-1 gap-2">
              <Skeleton className={cn('h-4', i % 2 ? 'w-24' : 'w-32')} />
              <Skeleton className={cn('h-2.5', i % 2 ? 'w-36' : 'w-28')} />
            </View>
            <Skeleton className="h-7 w-20 rounded-full" />
          </Card>
        ))}
      </View>
    </SkeletonPulse>
  );
}

/** Lista plana de filas (pantalla de Gastos): encabezado del día y sus gastos. */
export function ExpenseListSkeleton({ padded }: { padded: string }) {
  return (
    <SkeletonPulse>
      {[3, 2].map((rows, group) => (
        <View key={group}>
          <View className={cn('flex-row items-center justify-between pb-2 pt-5', padded)}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-14" />
          </View>
          <View className={padded === 'px-10' ? 'px-8' : 'px-3'}>
            {Array.from({ length: rows }, (_, i) => (
              <SkeletonRow key={i} index={group * 3 + i} />
            ))}
          </View>
        </View>
      ))}
    </SkeletonPulse>
  );
}

/** Dos tarjetas de resumen lado a lado (saldos, quincenas, totales de cuentas). */
export function StatPairSkeleton({ className, icon }: { className?: string; icon?: boolean }) {
  return (
    <SkeletonPulse>
      <View className={cn('flex-row gap-3', className)}>
        {[0, 1].map((i) => (
          <Card key={i} className="flex-1 gap-2">
            {icon && <SkeletonBadge size={36} />}
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-24" />
          </Card>
        ))}
      </View>
    </SkeletonPulse>
  );
}

/** Tarjeta principal morada del inicio, con el total del mes. */
export function HeroSkeleton() {
  return (
    <SkeletonPulse>
      <View className="mt-4 overflow-hidden rounded-[32px] bg-primary p-6">
        <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <Skeleton className="h-3.5 w-40 bg-white/25" />
        <Skeleton className="mt-3 h-10 w-52 bg-white/25" />
        <Skeleton className="mt-4 h-6 w-36 rounded-full bg-white/15" />
      </View>
    </SkeletonPulse>
  );
}

/** Carrusel horizontal de cuentas del inicio. */
export function AccountsCarouselSkeleton() {
  return (
    <>
      <SectionTitle title="Cuentas" />
      <SkeletonPulse>
        <View className="flex-row gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <Card key={i} className="w-44 gap-3">
              <SkeletonBadge size={40} />
              <View className="gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-28" />
              </View>
              <Skeleton className="h-2.5 w-20" />
            </Card>
          ))}
        </View>
      </SkeletonPulse>
    </>
  );
}

/** Gráfico de dona con su leyenda (gasto por categoría). */
export function CategoryChartSkeleton() {
  return (
    <>
      <SectionTitle title="Por categoría" />
      <SkeletonPulse>
        <Card className="flex-row items-center gap-5">
          <View className="h-[140px] w-[140px] items-center justify-center rounded-full border-[18px] border-border" />
          <View className="flex-1 gap-3.5">
            {['w-24', 'w-20', 'w-28', 'w-16'].map((w, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className={cn('h-3', w)} />
              </View>
            ))}
          </View>
        </Card>
      </SkeletonPulse>
    </>
  );
}

/** Formulario de edición mientras llegan los datos que se van a editar. */
export function FormSkeleton({ title }: { title: string }) {
  return (
    <ModalFrame>
      <View className="flex-1 bg-background">
        <ModalHeader title={title} />
        <SkeletonPulse style={{ paddingHorizontal: 20, gap: 20 }}>
          <View className="items-center gap-3 py-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-40" />
          </View>
          {['w-24', 'w-20', 'w-28', 'w-16'].map((w, i) => (
            <View key={i} className="gap-2">
              <Skeleton className={cn('h-3', w)} />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </View>
          ))}
          <Skeleton className="mt-2 h-12 w-full rounded-2xl" />
        </SkeletonPulse>
      </View>
    </ModalFrame>
  );
}
