import { Tabs } from 'expo-router/js-tabs';

import { Sidebar } from '@/components/sidebar';
import { TabBar } from '@/components/tab-bar';
import { useIsDesktop } from '@/lib/layout';

export default function TabsLayout() {
  // Web de escritorio: barra lateral. App y web angosta: tab bar flotante abajo.
  const isDesktop = useIsDesktop();
  return (
    <Tabs
      tabBar={(props) => (isDesktop ? <Sidebar {...props} /> : <TabBar {...props} />)}
      screenOptions={{ headerShown: false, tabBarPosition: isDesktop ? 'left' : 'bottom' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="gastos" options={{ title: 'Gastos' }} />
      <Tabs.Screen name="personas" options={{ title: 'Personas' }} />
      <Tabs.Screen name="deudas" options={{ title: 'Deudas' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
