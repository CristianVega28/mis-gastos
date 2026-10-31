import { Platform, useWindowDimensions } from 'react-native';

/** Ancho a partir del cual la web usa la vista de escritorio (barra lateral, columnas). */
export const DESKTOP_MIN_WIDTH = 960;

/**
 * true en la web de escritorio. La app nativa y la web en pantallas angostas
 * (ej. el navegador del celular) usan la vista móvil con tab bar inferior.
 */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;
}
