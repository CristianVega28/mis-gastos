import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { formatMoney, type CurrencyCode } from './money';

const supported = Platform.OS !== 'web';

export function configureNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('debts', {
      name: 'Recordatorios de deudas',
      importance: AndroidImportance.HIGH,
    });
  }
}

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return asked.granted;
}

/**
 * Programa un recordatorio a las 10:00 del día de vencimiento.
 * Devuelve el id de la notificación o null si no se programó.
 */
export async function scheduleDebtReminder(opts: {
  dueDate: string;
  personName: string;
  description: string;
  remainingCents: number;
  currency: CurrencyCode;
  direction: 'owed_to_me' | 'i_owe';
}): Promise<string | null> {
  if (!supported) return null;
  const [y, m, d] = opts.dueDate.split('-').map(Number);
  const date = new Date(y, m - 1, d, 10, 0, 0);
  if (date.getTime() <= Date.now()) return null;
  if (!(await ensurePermission())) return null;

  const amount = formatMoney(opts.remainingCents, opts.currency);
  return Notifications.scheduleNotificationAsync({
    content: {
      title:
        opts.direction === 'owed_to_me'
          ? `${opts.personName} te debe ${amount}`
          : `Le debes ${amount} a ${opts.personName}`,
      body: `Hoy vence: ${opts.description}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === 'android' ? { channelId: 'debts' } : {}),
    },
  });
}

export async function cancelReminder(id: string | null | undefined) {
  if (!supported || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function cancelAllReminders() {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
