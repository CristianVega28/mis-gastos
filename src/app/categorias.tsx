import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ModalFrame } from '@/components/modal-frame';
import { BackHeader } from '@/components/back-header';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/db/queries';
import { useThemeColors } from '@/lib/theme';
import { SkeletonPulse, SkeletonRowsCard } from '@/components/ui/skeleton';

export default function CategoriesScreen() {
  const colors = useThemeColors();
  const { data: categories, loading } = useCategories();

  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader
          title="Categorías"
          right={
            <IconButton
              icon={Plus}
              accessibilityLabel="Nueva categoría"
              onPress={() => router.push('/categoria-form')}
            />
          }
        />
        {loading ? (
          <SkeletonPulse>
            <SkeletonRowsCard className="mt-2" count={6} badge={40} />
          </SkeletonPulse>
        ) : (
          <Card className="mt-2 gap-1 px-2 py-2">
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/categoria-form', params: { id: c.id } })}
                className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-card-2"
              >
                <IconBadge icon={c.icon} color={c.color} size={40} />
                <Text weight="semibold" className="flex-1">
                  {c.name}
                </Text>
                <ChevronRight size={18} color={colors.muted} />
              </Pressable>
            ))}
          </Card>
        )}
        <View className="h-4" />
      </Screen>
    </ModalFrame>
  );
}
