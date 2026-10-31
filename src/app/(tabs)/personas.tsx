import { router } from 'expo-router';
import { ChevronRight, UserPlus, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Fab } from '@/components/fab';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { usePeopleBalances } from '@/db/queries';
import { useMoney } from '@/lib/format';
import { useIsDesktop } from '@/lib/layout';
import { useThemeColors } from '@/lib/theme';

export default function PeopleScreen() {
  const money = useMoney();
  const isDesktop = useIsDesktop();
  const colors = useThemeColors();
  const { data: people, loading } = usePeopleBalances();

  const others = people.filter((p) => !p.isMe);
  const totalOwed = others.reduce((s, p) => s + p.pendingSplits + p.owesMe, 0);

  return (
    <View className="flex-1 bg-background">
      <Screen>
        <ScreenHeader
          title="Personas"
          subtitle={totalOwed > 0 ? `Te deben ${money(totalOwed)} en total` : 'Todos al día'}
          right={
            <IconButton
              icon={UserPlus}
              accessibilityLabel="Agregar persona"
              onPress={() => router.push('/persona-form')}
            />
          }
        />

        {!loading && others.length === 0 && (
          <Card>
            <EmptyState
              icon={Users}
              title="Agrega a las personas"
              description="Pareja, roommates, familia… Así podrás repartir gastos y anotar lo que te deben."
              actionLabel="Agregar persona"
              onAction={() => router.push('/persona-form')}
            />
          </Card>
        )}

        <View className={isDesktop ? 'flex-row flex-wrap justify-between gap-y-3' : 'gap-3'}>
          {people.map((p, i) => {
            const owes = p.pendingSplits + p.owesMe - p.iOwe;
            return (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(i * 40).duration(300)}
                style={isDesktop ? { width: '49.2%' } : undefined}
              >
                <Pressable onPress={() => router.push(`/persona/${p.id}`)} className="active:opacity-80">
                  <Card className="flex-row items-center gap-3">
                    <Avatar name={p.name} color={p.color} size={48} />
                    <View className="flex-1">
                      <Text weight="semibold" className="text-base">
                        {p.name}
                        {p.isMe && <Text className="text-sm text-muted"> · tú</Text>}
                      </Text>
                      {p.isMe ? (
                        <Text className="text-xs text-muted">Tus partes de los gastos</Text>
                      ) : (
                        <Text className="text-xs text-muted">
                          {p.pendingSplits > 0 && `Gastos ${money(p.pendingSplits)}`}
                          {p.pendingSplits > 0 && (p.owesMe > 0 || p.iOwe > 0) && ' · '}
                          {p.owesMe > 0 && `Deudas ${money(p.owesMe)}`}
                          {p.owesMe > 0 && p.iOwe > 0 && ' · '}
                          {p.iOwe > 0 && `Le debes ${money(p.iOwe)}`}
                          {owes === 0 && p.iOwe === 0 && 'Al día'}
                        </Text>
                      )}
                    </View>
                    {!p.isMe && owes !== 0 && (
                      <View
                        className={
                          owes > 0 ? 'rounded-full bg-success-soft px-3 py-1' : 'rounded-full bg-danger-soft px-3 py-1'
                        }
                      >
                        <Text
                          weight="bold"
                          tabular
                          className={owes > 0 ? 'text-sm text-success' : 'text-sm text-danger'}
                        >
                          {owes > 0 ? '+' : '−'}
                          {money(Math.abs(owes))}
                        </Text>
                      </View>
                    )}
                    <ChevronRight size={18} color={colors.muted} />
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Screen>
      <Fab label="Agregar persona" onPress={() => router.push('/persona-form')} />
    </View>
  );
}
