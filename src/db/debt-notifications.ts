import { localStore } from '@/lib/storage';

// Los recordatorios son notificaciones locales: su id solo existe en este
// dispositivo, así que se guarda aquí y no en el servidor.

const KEY = 'debt-notifications';

function read(): Record<string, string> {
  try {
    return JSON.parse((localStore.getItem(KEY) as string | null) ?? '{}');
  } catch {
    return {};
  }
}

export function getDebtNotification(debtId: number): string | null {
  return read()[debtId] ?? null;
}

export function saveDebtNotification(debtId: number, notificationId: string | null) {
  const all = read();
  if (notificationId) all[debtId] = notificationId;
  else delete all[debtId];
  localStore.setItem(KEY, JSON.stringify(all));
}

export function clearDebtNotifications() {
  localStore.removeItem(KEY);
}
