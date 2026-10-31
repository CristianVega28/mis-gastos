import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { clearDebtNotifications } from '@/db/debt-notifications';
import type { ExpenseWithRelations } from '@/db/queries';
import { invalidate } from '@/db/use-live';

import { api } from './api';
import { todayISO } from './dates';
import { cancelAllReminders } from './reminders';

async function shareText(filename: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
}

export async function exportBackup() {
  const payload = await api<unknown>('/backup');
  await shareText(`mis-gastos-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset) {
  if (Platform.OS === 'web') {
    if (asset.file) return asset.file.text();
    return (await fetch(asset.uri)).text();
  }
  return new File(asset.uri).text();
}

/**
 * Reemplaza TODOS los datos de la cuenta por los del respaldo elegido.
 * Acepta también los respaldos de cuando los datos vivían en el dispositivo.
 * Devuelve null si el usuario canceló.
 */
export async function importBackup(): Promise<{ expenses: number; debts: number } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(await readPickedFile(result.assets[0]));
  } catch {
    throw new Error('El archivo no es un respaldo válido de Mis Gastos.');
  }

  const counts = await api<{ expenses: number; debts: number }>('/backup', { method: 'POST', body: payload });
  // Los recordatorios apuntaban a las deudas anteriores.
  await cancelAllReminders();
  clearDebtNotifications();
  invalidate();
  return counts;
}

function csvCell(value: string | number | null | undefined) {
  const s = value == null ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportMonthCsv(month: string) {
  const rows = await api<ExpenseWithRelations[]>('/expenses', { query: { month } });
  rows.sort((a, b) => a.date.localeCompare(b.date));

  const header = ['Fecha', 'Gasto', 'Categoría', 'Cuenta', 'Monto', 'Recurrente', 'Reparto', 'Nota'];
  const lines = rows.map((e) =>
    [
      e.date,
      e.title,
      e.category?.name ?? '',
      e.account?.name ?? '',
      (e.amountCents / 100).toFixed(2),
      e.isRecurring ? 'Sí' : 'No',
      e.splits
        .map((s) => `${s.person.name}: ${(s.amountCents / 100).toFixed(2)}${s.paid ? ' (pagado)' : ''}`)
        .join(' | '),
      e.note ?? '',
    ]
      .map(csvCell)
      .join(','),
  );
  await shareText(`gastos-${month}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv');
}
