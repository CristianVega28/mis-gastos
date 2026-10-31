import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export async function canUseBiometrics() {
  if (Platform.OS === 'web') return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

export async function authenticate(promptMessage = 'Desbloquea Mis Gastos') {
  if (Platform.OS === 'web') return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código',
  });
  return result.success;
}
