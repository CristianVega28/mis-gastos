import { router } from 'expo-router';

/**
 * Vuelve a la pantalla anterior. Si no hay a dónde volver (se abrió la URL
 * directo o se recargó la página en un modal), va al inicio en vez de no hacer nada.
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
