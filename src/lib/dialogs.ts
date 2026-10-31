import { Alert, Platform } from 'react-native';

/** Alert.alert no hace nada en react-native-web, así que en web usamos window.confirm. */
export function confirm(opts: {
  title: string;
  message?: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm([opts.title, opts.message].filter(Boolean).join('\n\n'))) opts.onConfirm();
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: opts.confirmText ?? 'Aceptar',
      style: opts.destructive ? 'destructive' : 'default',
      onPress: opts.onConfirm,
    },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}
