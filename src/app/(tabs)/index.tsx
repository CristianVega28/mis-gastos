import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AccountBadge } from '@/components/account-badge';
import { MonthBars } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { ExpenseRow } from '@/components/expense-row';
import { MonthSwitcher } from '@/components/month-switcher';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dot } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import {
  useAccounts,
  useCategoryBreakdown,
  useMonthExpenses,
  useMonthlyTotals,
  useMonthSchedule,
  usePeopleBalances,
  usePeopleMonthSummary,
} from '@/db/queries';
import { monthLabel, shiftMonth } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useMoney } from '@/lib/format';
import { useIsDesktop } from '@/lib/layout';
import { halfLabel, summarizeByHalf } from '@/lib/schedule';
import { useThemeColors } from '@/lib/theme';
import { useUI } from '@/store/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const month = useUI((s) => s.month);
  const money = useMoney();
  const colors = useThemeColors();
  const isDesktop = useIsDesktop();

  const { data: expenses } = useMonthExpenses(month);
  const { data: totals } = useMonthlyTotals(month, 6);
  const { data: byCategory } = useCategoryBreakdown(month);
  const { data: byPerson } = usePeopleMonthSummary(month);
  const { data: balances } = usePeopleBalances();
  const { data: accounts, loading: accountsLoading } = useAccounts(month);
  const { data: schedule, loading: scheduleLoading } = useMonthSchedule(month);

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const prevTotal = totals.find((t) => t.month === shiftMonth(month, -1))?.total ?? 0;
  const change = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;

  const { owedToMe, iOwe } = useMemo(
    () =>
      balances.reduce((acc, p) => ({ owedToMe: acc.owedToMe + p.pendingSplits + p.owesMe, iOwe: acc.iOwe + p.iOwe }), {
        owedToMe: 0,
        iOwe: 0,
      }),
    [balances],
  );

  const titleBlock = (
    <View>
      <Text className="text-sm text-muted">{greeting()} 👋</Text>
      <Text weight="extrabold" className="text-3xl tracking-tight">
        Tu resumen
      </Text>
    </View>
  );
  const heroBlock = (
    <>
      {/* Tarjeta principal */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View className="mt-4 overflow-hidden rounded-[32px] bg-primary p-6">
          <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <View className="absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-white/5" />
          <Text weight="medium" className="text-sm text-white/75">
            Gastado en {monthLabel(month)}
          </Text>
          <Text
            weight="extrabold"
            tabular
            className="mt-1 text-[40px] leading-[48px] tracking-tight text-white"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {money(total)}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            {change !== null ? (
              <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                {change > 0 ? <TrendingUp size={14} color="#fff" /> : <TrendingDown size={14} color="#fff" />}
                <Text weight="semibold" className="text-xs text-white">
                  {change > 0 ? '+' : ''}
                  {Math.round(change * 100)}% vs mes anterior
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <Sparkles size={14} color="#fff" />
                <Text weight="semibold" className="text-xs text-white">
                  {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} este mes
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </>
  );
  const statsBlock = (
    <>
      {/* Saldos */}
      <Animated.View
        entering={FadeInDown.delay(80).duration(400)}
        style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}
      >
        <Pressable className="flex-1" onPress={() => router.push('/deudas')}>
          <Card className="gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-success-soft">
              <ArrowDownLeft size={18} color={colors.success} strokeWidth={2.4} />
            </View>
            <Text className="text-xs text-muted">Te deben</Text>
            <Text weight="bold" tabular className="text-lg text-success" numberOfLines={1} adjustsFontSizeToFit>
              {money(owedToMe)}
            </Text>
          </Card>
        </Pressable>
        <Pressable className="flex-1" onPress={() => router.push('/deudas')}>
          <Card className="gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-danger-soft">
              <ArrowUpRight size={18} color={colors.danger} strokeWidth={2.4} />
            </View>
            <Text className="text-xs text-muted">Debes</Text>
            <Text weight="bold" tabular className="text-lg text-danger" numberOfLines={1} adjustsFontSizeToFit>
              {money(iOwe)}
            </Text>
          </Card>
        </Pressable>
      </Animated.View>
    </>
  );
  const accountsBlock = accountsLoading ? null : (
    <>
      {/* Cuentas: de dónde sale cada gasto */}
      <SectionTitle
        title="Cuentas"
        action={accounts.length ? 'Ver todas' : undefined}
        onAction={() => router.push('/cuentas')}
      />
      {accounts.length === 0 ? (
        <Pressable onPress={() => router.push('/cuenta-form')}>
          <Card className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
              <Wallet size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text weight="semibold">Agrega tus cuentas</Text>
              <Text className="text-xs text-muted">
                Banco, tarjeta o efectivo: verás de dónde se descuenta cada gasto.
              </Text>
            </View>
            <Plus size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className={isDesktop ? undefined : '-mx-5'}
          contentContainerClassName={isDesktop ? 'gap-3' : 'gap-3 px-5'}
        >
          {accounts.map((a) => (
            <Pressable key={a.id} onPress={() => router.push(`/cuenta/${a.id}`)}>
              <Card className="w-44 gap-3">
                <AccountBadge type={a.type} color={a.color} size={40} />
                <View>
                  <Text weight="semibold" numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text
                    weight="bold"
                    tabular
                    className={cn('text-lg', a.balance < 0 && 'text-danger')}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {money(a.balance)}
                  </Text>
                </View>
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {a.monthSpent > 0 ? `−${money(a.monthSpent)} este mes` : 'Sin gastos este mes'}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
  const scheduleBlock = scheduleLoading ? null : (
    <>
      {/* Cronograma: lo que toca pagar en cada quincena */}
      <SectionTitle
        title="Pagos del mes"
        action={schedule.length ? 'Ver cronograma' : undefined}
        onAction={() => router.push('/cronograma')}
      />
      {schedule.length === 0 ? (
        <Pressable onPress={() => router.push('/pago-form')}>
          <Card className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
              <CalendarClock size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text weight="semibold">Arma tu cronograma de pagos</Text>
              <Text className="text-xs text-muted">Arriendo, cuentas, tarjeta: qué pagar en cada quincena.</Text>
            </View>
            <Plus size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ) : (
        <View className="flex-row gap-3">
          {summarizeByHalf(schedule).map((h) => (
            <Pressable key={h.half} className="flex-1" onPress={() => router.push('/cronograma')}>
              <Card className="gap-1">
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {halfLabel(h.half, month)}
                </Text>
                <Text weight="bold" tabular className="text-lg" numberOfLines={1} adjustsFontSizeToFit>
                  {money(h.total)}
                </Text>
                <Text className={cn('text-xs', h.pending > 0 ? 'text-warning' : 'text-success')} numberOfLines={1}>
                  {h.items.length === 0 ? 'Sin pagos' : h.pending > 0 ? `Falta ${money(h.pending)}` : 'Al día ✓'}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
  const categoryBlock =
    expenses.length === 0 ? (
      <>
        <Card className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Sin gastos este mes"
            description="Agrega tu primer gasto y asígnalo a quien le corresponda."
            actionLabel="Agregar gasto"
            onAction={() => router.push('/gasto')}
          />
        </Card>
      </>
    ) : (
      <>
        {/* Por categoría */}
        <SectionTitle title="Por categoría" />
        <Card className="flex-row items-center gap-5">
          <DonutChart data={byCategory.map((c) => ({ value: c.total, color: c.color }))} size={140} thickness={18}>
            <Text className="text-xs text-muted">{byCategory.length} cat.</Text>
            <Text weight="bold" tabular className="text-sm">
              {money(total, { compact: true })}
            </Text>
          </DonutChart>
          <View className="flex-1 gap-2.5">
            {byCategory.slice(0, 5).map((c) => (
              <View key={c.id ?? 'none'} className="flex-row items-center gap-2">
                <Dot color={c.color} />
                <Text className="flex-1 text-sm" numberOfLines={1}>
                  {c.name}
                </Text>
                <Text weight="semibold" tabular className="text-sm">
                  {Math.round((c.total / total) * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </>
    );
  const peopleBlock =
    expenses.length > 0 ? (
      <>
        {/* Por persona */}
        {byPerson.length > 0 && (
          <>
            <SectionTitle title="Por persona" action="Ver todas" onAction={() => router.push('/personas')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className={isDesktop ? undefined : '-mx-5'}
              contentContainerClassName={isDesktop ? 'gap-3' : 'gap-3 px-5'}
            >
              {byPerson.map((p) => (
                <Pressable key={p.id} onPress={() => router.push(`/persona/${p.id}`)}>
                  <Card className="w-40 gap-3">
                    <Avatar name={p.name} color={p.color} size={40} />
                    <View>
                      <Text weight="semibold" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text weight="bold" tabular className="text-lg">
                        {money(p.assigned)}
                      </Text>
                    </View>
                    {!p.isMe && (
                      <Text className={p.pending > 0 ? 'text-xs text-warning' : 'text-xs text-success'}>
                        {p.pending > 0 ? `Pendiente ${money(p.pending)}` : 'Al día ✓'}
                      </Text>
                    )}
                    {p.isMe && <Text className="text-xs text-muted">Tu parte</Text>}
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </>
    ) : null;
  const trendBlock = (
    <>
      {/* Tendencia */}
      <SectionTitle title="Últimos 6 meses" />
      <Card>
        <MonthBars data={totals} selected={month} format={(c) => money(c, { compact: true })} />
      </Card>
    </>
  );
  const recentBlock = (
    <>
      {expenses.length > 0 && (
        <>
          <SectionTitle title="Recientes" action="Ver todos" onAction={() => router.push('/gastos')} />
          <Card className="gap-1 px-2 py-2">
            {expenses.slice(0, 5).map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </Card>
        </>
      )}
    </>
  );
  const footerBlock = (
    <>
      <View className="mt-4 flex-row items-center justify-center gap-2">
        <Dot color={colors.muted} size={4} />
        <Text className="text-xs text-muted">Tus datos se sincronizan en todos tus dispositivos</Text>
        <Dot color={colors.muted} size={4} />
      </View>
    </>
  );

  // Web de escritorio: dashboard en dos columnas
  if (isDesktop) {
    return (
      <Screen>
        <View className="mb-6 flex-row items-center justify-between">
          {titleBlock}
          <View className="w-[360px]">
            <MonthSwitcher />
          </View>
        </View>
        <View className="flex-row items-start gap-6">
          <View className="flex-1">
            {heroBlock}
            {statsBlock}
            {categoryBlock}
            {trendBlock}
          </View>
          <View className="w-[380px]">
            {accountsBlock}
            {scheduleBlock}
            {peopleBlock}
            {recentBlock}
            {footerBlock}
          </View>
        </View>
      </Screen>
    );
  }

  // App (y web angosta): una columna
  return (
    <Screen>
      <View className="mb-5 flex-row items-center justify-between pt-2">
        {titleBlock}
        <IconButton
          icon={Plus}
          accessibilityLabel="Nuevo gasto"
          className="h-12 w-12 bg-primary"
          color={colors.onPrimary}
          onPress={() => router.push('/gasto')}
        />
      </View>
      <MonthSwitcher />
      {heroBlock}
      {statsBlock}
      {accountsBlock}
      {scheduleBlock}
      {categoryBlock}
      {peopleBlock}
      {trendBlock}
      {recentBlock}
      {footerBlock}
    </Screen>
  );
}
