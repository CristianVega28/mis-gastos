import { Fingerprint, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';

import { authenticate } from '@/lib/auth';
import { useThemeColors } from '@/lib/theme';
import { useSettings } from '@/store/settings';

import { Button } from './ui/button';
import { Text } from './ui/text';

/** Tiempo en segundo plano tras el cual se vuelve a pedir desbloqueo. */
const RELOCK_AFTER_MS = 30_000;

export function LockGate({ children }: { children: React.ReactNode }) {
  const lockEnabled = useSettings((s) => s.lockEnabled);
  // Los ajustes se hidratan de forma síncrona, así que esto es fiable al montar.
  // Al activar el bloqueo desde Ajustes no se bloquea la sesión actual.
  const [locked, setLocked] = useState(() => useSettings.getState().lockEnabled);
  const backgroundAt = useRef<number | null>(null);
  const colors = useThemeColors();

  const unlock = useCallback(async () => {
    if (await authenticate()) setLocked(false);
  }, []);

  useEffect(() => {
    // unlock solo cambia el estado tras el await de la biometría (no es síncrono)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (useSettings.getState().lockEnabled) unlock();
  }, [unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!useSettings.getState().lockEnabled) return;
      if (state === 'background') {
        backgroundAt.current = Date.now();
      } else if (state === 'active' && backgroundAt.current) {
        if (Date.now() - backgroundAt.current > RELOCK_AFTER_MS) {
          setLocked(true);
          unlock();
        }
        backgroundAt.current = null;
      }
    });
    return () => sub.remove();
  }, [unlock]);

  if (!lockEnabled || !locked) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-10">
      <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-primary-soft">
        <Lock size={40} color={colors.primary} strokeWidth={2} />
      </View>
      <View className="items-center gap-2">
        <Text weight="extrabold" className="text-2xl">
          Mis Gastos está bloqueado
        </Text>
        <Text className="text-center text-muted">Usa Face ID, huella o tu código para continuar.</Text>
      </View>
      <Button title="Desbloquear" icon={Fingerprint} size="lg" onPress={unlock} className="self-stretch" />
    </View>
  );
}
