import { LogIn, UserPlus, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import type { User } from '@/db/types';
import { api, ApiError } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';
import { useAuth } from '@/store/auth';

type Mode = 'login' | 'register';
type Errors = { email?: string; password?: string; name?: string; form?: string };

/** Inicio de sesión y registro. Se muestra en lugar de la app cuando no hay sesión. */
export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const signIn = useAuth((s) => s.signIn);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next: Errors = {};
    if (!email.trim()) next.email = 'Escribe tu correo';
    if (mode === 'register' && password.length < 8) next.password = 'Usa al menos 8 caracteres';
    if (!password) next.password = 'Escribe tu contraseña';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, {
        method: 'POST',
        body: { email, password, name },
        anonymous: true,
      });
      haptic.success();
      signIn(res.token, res.user);
    } catch (e) {
      haptic.warning();
      if (e instanceof ApiError && (e.field === 'email' || e.field === 'password' || e.field === 'name')) {
        setErrors({ [e.field]: e.message });
      } else {
        setErrors({ form: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[420px] gap-6 self-center">
          <View className="items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary">
              <Wallet size={32} color={colors.onPrimary} strokeWidth={2.2} />
            </View>
            <Text weight="extrabold" className="text-3xl tracking-tight">
              Mis Gastos
            </Text>
            <Text className="text-center text-sm text-muted">
              {isRegister
                ? 'Crea tu cuenta para usar tus datos en el celular y en la web.'
                : 'Entra para ver tus gastos en cualquier dispositivo.'}
            </Text>
          </View>

          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErrors({});
            }}
            options={[
              { value: 'login', label: 'Entrar' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
          />

          <View className="gap-4">
            {isRegister && (
              <Input
                label="Nombre (opcional)"
                placeholder="Cómo te llamas"
                value={name}
                onChangeText={setName}
                autoComplete="name"
                error={errors.name}
              />
            )}
            <Input
              label="Correo"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              error={errors.email}
            />
            <Input
              label="Contraseña"
              placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onSubmitEditing={onSubmit}
              error={errors.password}
            />
            {errors.form && <Text className="text-center text-sm text-danger">{errors.form}</Text>}
          </View>

          <Button
            title={isRegister ? 'Crear cuenta' : 'Entrar'}
            icon={isRegister ? UserPlus : LogIn}
            size="lg"
            loading={loading}
            onPress={onSubmit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
