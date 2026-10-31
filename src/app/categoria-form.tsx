import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorPicker } from '@/components/forms/color-picker';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Button, IconButton } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { deleteCategory, saveCategory } from '@/db/mutations';
import { useCategories } from '@/db/queries';
import type { Category } from '@/db/types';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { cn } from '@/lib/cn';
import { confirm } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { PALETTE } from '@/lib/palette';
import { useThemeColors } from '@/lib/theme';

export default function CategoryFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const { data: categories, loading } = useCategories();
  const category = id ? categories.find((c) => c.id === id) : undefined;

  // Al editar, espera a tener la categoría para inicializar el formulario
  if (id && (loading || !category)) return <View className="flex-1 bg-background" />;
  return (
    <ModalFrame>
      <CategoryForm key={category?.id ?? 'new'} id={id} initial={category} />
    </ModalFrame>
  );
}

function CategoryForm({ id, initial }: { id?: number; initial?: Category }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'other');
  const [color, setColor] = useState<string>(initial?.color ?? PALETTE[0]);
  const [error, setError] = useState<string>();

  const onSave = async () => {
    if (!name.trim()) {
      setError('Escribe un nombre');
      return;
    }
    await saveCategory({ name, icon, color }, id);
    haptic.success();
    router.back();
  };

  const onDelete = () =>
    confirm({
      title: 'Eliminar categoría',
      message: 'Los gastos de esta categoría quedarán sin categoría.',
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        await deleteCategory(id!);
        router.back();
      },
    });

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader
        title={id ? 'Editar categoría' : 'Nueva categoría'}
        right={
          id ? (
            <IconButton icon={Trash2} accessibilityLabel="Eliminar" color={colors.danger} onPress={onDelete} />
          ) : null
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <View className="items-center py-4">
          <IconBadge icon={icon} color={color} size={80} />
        </View>
        <Input
          label="Nombre"
          placeholder="Ej: Mascotas"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(undefined);
          }}
          error={error}
        />
        <View className="gap-2">
          <Text weight="medium" className="text-sm text-muted">
            Ícono
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
              <Pressable
                key={key}
                onPress={() => {
                  haptic.selection();
                  setIcon(key);
                }}
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-2xl border',
                  icon === key ? 'border-primary bg-primary-soft' : 'border-border bg-card',
                )}
              >
                <Icon size={22} color={icon === key ? colors.primary : colors.foreground} />
              </Pressable>
            ))}
          </View>
        </View>
        <View className="gap-2">
          <Text weight="medium" className="text-sm text-muted">
            Color
          </Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>
      </ScrollView>
      <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button title={id ? 'Guardar cambios' : 'Crear categoría'} icon={Check} size="lg" onPress={onSave} />
      </View>
    </KeyboardAvoidingView>
  );
}
