import '../global.css';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Uniwind, useUniwind } from 'uniwind';

import { LockGate } from '@/components/lock-gate';
import { useIsDesktop } from '@/lib/layout';
import { configureNotifications } from '@/lib/reminders';
import { useThemeColors } from '@/lib/theme';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';

// Al abrir o recargar una URL de detalle o modal (/gasto, /persona/3…), carga las
// pestañas debajo para que "Volver" y cerrar lleven a la app y no a una pantalla vacía.
export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const themePref = useSettings((s) => s.theme);
  useEffect(() => {
    Uniwind.setTheme(themePref);
  }, [themePref]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LockGate>
        <RootStack />
      </LockGate>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const colors = useThemeColors();
  const { theme } = useUniwind();
  const isDesktop = useIsDesktop();
  // La sesión se lee de forma síncrona al iniciar, así que no hay parpadeo del login.
  const signedIn = useAuth((s) => !!s.token);
  // Escritorio: diálogo centrado sobre la app (ver ModalFrame). App: hoja modal / push nativo.
  const modal = {
    presentation: isDesktop ? 'transparentModal' : 'modal',
    contentStyle: isDesktop ? { backgroundColor: 'transparent' } : undefined,
  } as const;
  const detail = isDesktop ? modal : {};

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="persona/[id]" options={detail} />
          <Stack.Screen name="deuda/[id]" options={detail} />
          <Stack.Screen name="categorias" options={detail} />
          <Stack.Screen name="cuentas" options={detail} />
          <Stack.Screen name="cuenta/[id]" options={detail} />
          <Stack.Screen name="cronograma" options={detail} />
          <Stack.Screen name="gasto" options={modal} />
          <Stack.Screen name="persona-form" options={modal} />
          <Stack.Screen name="deuda-form" options={modal} />
          <Stack.Screen name="categoria-form" options={modal} />
          <Stack.Screen name="cuenta-form" options={modal} />
          <Stack.Screen name="pago-form" options={modal} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
