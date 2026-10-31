import { zodResolver } from '@hookform/resolvers/zod';
import { Contact } from 'expo-contacts';
import { router, useLocalSearchParams } from 'expo-router';
import { BookUser, Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ColorPicker } from '@/components/forms/color-picker';
import { ModalFrame } from '@/components/modal-frame';
import { ModalHeader } from '@/components/modal-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { savePerson } from '@/db/mutations';
import { usePeople } from '@/db/queries';
import { notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { PALETTE } from '@/lib/palette';

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre'),
  phone: z.string(),
  color: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function PersonFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const insets = useSafeAreaInsets();
  const { data: people } = usePeople();
  const person = id ? people.find((p) => p.id === id) : undefined;

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', color: PALETTE[(people.length + 1) % PALETTE.length] },
  });

  useEffect(() => {
    if (person) reset({ name: person.name, phone: person.phone ?? '', color: person.color });
  }, [person, reset]);

  const [name, color] = useWatch({ control, name: ['name', 'color'] });

  const pickContact = async () => {
    try {
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const fullName = await contact.getFullName();
      if (fullName) setValue('name', fullName, { shouldValidate: true });
      const phones = await contact.getPhones?.();
      const phone = phones?.[0]?.number;
      if (phone) setValue('phone', phone);
      haptic.success();
    } catch (e) {
      notify('No se pudo abrir tus contactos', e instanceof Error ? e.message : undefined);
    }
  };

  const onSubmit = handleSubmit(async (v) => {
    await savePerson({ name: v.name, color: v.color, phone: v.phone || null }, id);
    haptic.success();
    router.back();
  });

  return (
    <ModalFrame>
      <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalHeader title={id ? 'Editar persona' : 'Nueva persona'} />
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-2 py-4">
            <Avatar name={name || '?'} color={color} size={88} />
            <Text weight="bold" className="text-xl">
              {name || 'Nombre'}
            </Text>
          </View>

          {Platform.OS !== 'web' && !person?.isMe && (
            <Button title="Elegir de mis contactos" variant="secondary" icon={BookUser} onPress={pickContact} />
          )}

          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                label="Nombre"
                placeholder="Ej: Camila"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                autoFocus={!id}
              />
            )}
          />

          {!person?.isMe && (
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  label="Teléfono (opcional)"
                  placeholder="+56 9 1234 5678"
                  keyboardType="phone-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
          )}

          <View className="gap-2">
            <Text weight="medium" className="text-sm text-muted">
              Color
            </Text>
            <Controller
              control={control}
              name="color"
              render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
            />
          </View>
        </ScrollView>
        <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title={id ? 'Guardar cambios' : 'Agregar persona'}
            icon={Check}
            size="lg"
            onPress={() => onSubmit()}
          />
        </View>
      </KeyboardAvoidingView>
    </ModalFrame>
  );
}
