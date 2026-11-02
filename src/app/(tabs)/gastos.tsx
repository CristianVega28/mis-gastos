import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Repeat, Receipt, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseRow } from '@/components/expense-row';
import { Fab } from '@/components/fab';
import { MonthSwitcher } from '@/components/month-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, Dot } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader, TAB_BAR_SPACE } from '@/components/ui/screen';
import { FONTS, NO_OUTLINE, Text } from '@/components/ui/text';
import { copyRecurring } from '@/db/mutations';
import { useCategories, useMonthExpenses, type ExpenseWithRelations } from '@/db/queries';
import { dayLabel, shiftMonth } from '@/lib/dates';
import { useMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useIsDesktop } from '@/lib/layout';
import { useThemeColors } from '@/lib/theme';
import { useUI } from '@/store/ui';
import { ExpenseListSkeleton } from '@/components/skeletons';

type Item = { type: 'header'; date: string; total: number } | { type: 'expense'; expense: ExpenseWithRelations };

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const colors = useThemeColors();
  const money = useMoney();
  const month = useUI((s) => s.month);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const { data: expenses, loading } = useMonthExpenses(month);
  const { data: prevExpenses } = useMonthExpenses(shiftMonth(month, -1));
  const { data: categories } = useCategories();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (categoryId === null || e.categoryId === categoryId) &&
        (!q || e.title.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q)),
    );
  }, [expenses, categoryId, query]);

  const items = useMemo(() => {
    const out: Item[] = [];
    let current: Extract<Item, { type: 'header' }> | null = null;
    for (const e of filtered) {
      if (!current || current.date !== e.date) {
        current = { type: 'header', date: e.date, total: 0 };
        out.push(current);
      }
      current.total += e.amountCents;
      out.push({ type: 'expense', expense: e });
    }
    return out;
  }, [filtered]);

  const total = filtered.reduce((s, e) => s + e.amountCents, 0);

  // Recurrentes del mes anterior que aún no están en este mes
  const missingRecurring = useMemo(() => {
    const here = new Set(expenses.filter((e) => e.isRecurring).map((e) => e.title.toLowerCase()));
    return prevExpenses.filter((e) => e.isRecurring && !here.has(e.title.toLowerCase()));
  }, [expenses, prevExpenses]);

  const onCopyRecurring = () => {
    // La lista se actualiza sola al copiar, no hace falta un aviso
    copyRecurring(shiftMonth(month, -1), month).then(
      () => void haptic.success(),
      () => {},
    );
  };

  const header = (
    <View className={isDesktop ? 'px-10' : 'px-5'} style={{ paddingTop: isDesktop ? 32 : insets.top + 8 }}>
      <ScreenHeader title="Gastos" subtitle={loading ? 'Cargando…' : `${filtered.length} movimientos · ${money(total)}`} />
      <MonthSwitcher />

      <View className="mt-3 h-12 flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4">
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar gasto"
          placeholderTextColor={colors.muted}
          className="flex-1 text-base text-foreground"
          style={[{ fontFamily: FONTS.medium }, NO_OUTLINE]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mt-3"
        contentContainerClassName="gap-2 px-5"
      >
        <Chip label="Todas" selected={categoryId === null} onPress={() => setCategoryId(null)} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            color={c.color}
            selected={categoryId === c.id}
            left={<Dot color={c.color} size={8} />}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>

      {missingRecurring.length > 0 && (
        <Card className="mt-4 flex-row items-center gap-3 border-primary/30 bg-primary-soft">
          <Repeat size={20} color={colors.primary} />
          <View className="flex-1">
            <Text weight="semibold">Gastos recurrentes</Text>
            <Text className="text-xs text-muted">
              {missingRecurring.length} del mes anterior aún no están en este mes
            </Text>
          </View>
          <Button title="Copiar" size="sm" onPress={onCopyRecurring} />
        </Card>
      )}
      <View className="h-2" />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className={isDesktop ? 'w-full max-w-[1120px] flex-1 self-center' : 'flex-1'}>
        <FlashList
          data={items}
          ListHeaderComponent={header}
          keyExtractor={(item) => (item.type === 'header' ? `h-${item.date}` : `e-${item.expense.id}`)}
          getItemType={(item) => item.type}
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <View className={cn('flex-row items-center justify-between pb-1 pt-4', isDesktop ? 'px-10' : 'px-5')}>
                <Text weight="semibold" className="text-sm text-muted">
                  {dayLabel(item.date)}
                </Text>
                <Text weight="semibold" tabular className="text-sm text-muted">
                  {money(item.total)}
                </Text>
              </View>
            ) : (
              <View className={isDesktop ? 'px-8' : 'px-3'}>
                <ExpenseRow expense={item.expense} />
              </View>
            )
          }
          ListEmptyComponent={
            loading ? (
              <ExpenseListSkeleton padded={isDesktop ? 'px-10' : 'px-5'} />
            ) : (
              <EmptyState
                icon={Receipt}
                title={query || categoryId ? 'Sin resultados' : 'Aún no hay gastos'}
                description={
                  query || categoryId
                    ? 'Prueba con otro filtro.'
                    : 'Toca el botón + para registrar tu primer gasto del mes.'
                }
              />
            )
          }
          contentContainerStyle={{ paddingBottom: isDesktop ? 120 : TAB_BAR_SPACE + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
      <Fab label="Nuevo gasto" onPress={() => router.push('/gasto')} />
    </View>
  );
}
