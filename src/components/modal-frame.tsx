import { router } from 'expo-router';
import { createContext, useContext } from 'react';
import { Pressable, View } from 'react-native';

import { useIsDesktop } from '@/lib/layout';

const InModalContext = createContext(false);

/** true si la pantalla se está mostrando dentro de un diálogo de escritorio. */
export function useInModal() {
  return useContext(InModalContext);
}

/**
 * En la web de escritorio, muestra la pantalla como un diálogo centrado sobre
 * un fondo oscuro. En la app (y la web angosta) no hace nada.
 */
export function ModalFrame({ children, size = 'md' }: { children: React.ReactNode; size?: 'md' | 'lg' }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center p-6">
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={() => router.back()}
        className="absolute inset-0 bg-black/60"
        style={{ cursor: 'default' } as object}
      />
      <View
        className="w-full overflow-hidden rounded-[28px] border border-border bg-background"
        style={{
          maxWidth: size === 'lg' ? 720 : 560,
          height: '90%',
          maxHeight: 860,
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        <InModalContext value={true}>{children}</InModalContext>
      </View>
    </View>
  );
}
