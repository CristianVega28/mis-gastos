import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Fingerprint,
  LogOut,
  Shapes,
  Upload,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { SwitchRow } from '@/components/ui/switch-row';
import { Text } from '@/components/ui/text';
import { authenticate, canUseBiometrics } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { exportBackup, exportMonthCsv, importBackup } from '@/lib/backup';
import { monthLabel } from '@/lib/dates';
import { confirm, notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { CURRENCIES } from '@/lib/money';
import { cancelAllReminders } from '@/lib/reminders';
import { useThemeColors } from '@/lib/theme';
import { useAuth } from '@/store/auth';
import { useSettings, type ThemePreference } from '@/store/settings';
import { useUI } from '@/store/ui';

function Row({
  icon: Icon,
  title,
  description,
  onPress,
  loading,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} disabled={loading} className="flex-row items-center gap-3 py-2 active:opacity-70">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-card-2">
        <Icon size={20} color={colors.foreground} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text weight="semibold">{loading ? 'Procesando…' : title}</Text>
        {description && <Text className="text-xs text-muted">{description}</Text>}
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text weight="semibold" className="mb-2 ml-1 text-xs uppercase tracking-wider text-muted">
        {title}
      </Text>
      <Card className="gap-1 py-2">{children}</Card>
    </View>
  );
}

export default function SettingsScreen() {
  const settings = useSettings();
  const month = useUI((s) => s.month);
  const user = useAuth((s) => s.user);
  const [busy, setBusy] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      notify('Ocurrió un error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleLock = async (value: boolean) => {
    if (value) {
      if (!(await canUseBiometrics())) {
        notify('No disponible', 'Configura Face ID, huella o un código en tu dispositivo primero.');
        return;
      }
      if (!(await authenticate('Confirma para activar el bloqueo'))) return;
    }
    haptic.success();
    settings.setLockEnabled(value);
  };

  const toggleReminders = async (value: boolean) => {
    settings.setRemindersEnabled(value);
    if (!value) await cancelAllReminders();
  };

  const onSignOut = () =>
    confirm({
      title: 'Cerrar sesión',
      message: 'Tus datos quedan guardados en el servidor. Podrás volver a entrar con tu correo.',
      confirmText: 'Cerrar sesión',
      destructive: true,
      onConfirm: async () => {
        // Los recordatorios son de esta cuenta
        await cancelAllReminders();
        useAuth.getState().signOut();
      },
    });

  const onImport = () =>
    confirm({
      title: 'Restaurar respaldo',
      message: 'Se reemplazarán TODOS los datos de tu cuenta por los del archivo. Esta acción no se puede deshacer.',
      confirmText: 'Elegir archivo',
      destructive: true,
      onConfirm: () =>
        run('import', async () => {
          const result = await importBackup();
          if (result) {
            haptic.success();
            notify('Respaldo restaurado', `${result.expenses} gastos y ${result.debts} deudas importados.`);
          }
        }),
    });

  return (
    <Screen>
      <ScreenHeader title="Ajustes" />

      <Group title="Cuenta">
        <Row
          icon={LogOut}
          title="Cerrar sesión"
          description={user?.name ? `${user.name} · ${user.email}` : (user?.email ?? '')}
          onPress={onSignOut}
        />
      </Group>

      <Group title="Apariencia">
        <View className="py-2">
          <Segmented<ThemePreference>
            value={settings.theme}
            onChange={settings.setTheme}
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
          />
        </View>
      </Group>

      <View className="mt-6">
        <Text weight="semibold" className="mb-2 ml-1 text-xs uppercase tracking-wider text-muted">
          Moneda
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerClassName="gap-2 px-5"
        >
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={`${c.code} · ${c.label}`}
              selected={settings.currency === c.code}
              onPress={() => settings.setCurrency(c.code)}
            />
          ))}
        </ScrollView>
      </View>

      <Group title="Organización">
        <Row
          icon={Wallet}
          title="Cuentas"
          description="Banco, tarjetas y efectivo: de dónde sale cada gasto"
          onPress={() => router.push('/cuentas')}
        />
        <Row
          icon={CalendarClock}
          title="Cronograma de pagos"
          description="Lo que pagas cada mes, por quincena"
          onPress={() => router.push('/cronograma')}
        />
        <Row
          icon={Shapes}
          title="Categorías"
          description="Crea y edita tus categorías"
          onPress={() => router.push('/categorias')}
        />
      </Group>

      {!isWeb && (
        <Group title="Seguridad y avisos">
          <SwitchRow
            icon={Fingerprint}
            title="Bloqueo con biometría"
            description="Pide Face ID o huella al abrir la app"
            value={settings.lockEnabled}
            onValueChange={toggleLock}
          />
          <SwitchRow
            icon={Bell}
            title="Recordatorios de deudas"
            description="Aviso el día que vence una deuda"
            value={settings.remindersEnabled}
            onValueChange={toggleReminders}
          />
        </Group>
      )}

      <Group title="Tus datos">
        <Row
          icon={Download}
          title="Exportar respaldo"
          description="Archivo JSON con todos tus datos"
          loading={busy === 'export'}
          onPress={() => run('export', exportBackup)}
        />
        <Row
          icon={Upload}
          title="Restaurar respaldo"
          description="Importa un JSON exportado antes (también de la versión sin cuenta)"
          loading={busy === 'import'}
          onPress={onImport}
        />
        <Row
          icon={FileSpreadsheet}
          title="Exportar mes a CSV"
          description={`${monthLabel(month)} · para Excel o Sheets`}
          loading={busy === 'csv'}
          onPress={() => run('csv', () => exportMonthCsv(month))}
        />
      </Group>

      <View className="mt-8 items-center gap-1">
        <Text weight="bold">Mis Gastos</Text>
        <Text className="text-xs text-muted">Versión {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Text className="mt-2 px-8 text-center text-xs text-muted">
          Tus datos se guardan en tu servidor ({API_URL}) y los ves en todos tus dispositivos.
        </Text>
      </View>
    </Screen>
  );
}
