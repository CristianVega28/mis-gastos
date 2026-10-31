import { useEffect, useEffectEvent, useState } from 'react';
import { AppState, Platform } from 'react-native';

const listeners = new Set<() => void>();

/** Avisa a todas las consultas montadas que los datos cambiaron (tras una mutación). */
export function invalidate() {
  for (const listener of listeners) listener();
}

/** Al volver a la app, recarga: los datos pueden haber cambiado desde otro dispositivo. */
function subscribeToFocus(onFocus: () => void) {
  if (Platform.OS === 'web') {
    const handler = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') onFocus();
  });
  return () => sub.remove();
}

/**
 * Ejecuta una consulta a la API y la repite cuando hay una mutación o la app
 * vuelve a primer plano. Mientras recarga, conserva los datos anteriores.
 */
export function useLive<T>(query: () => Promise<T>, deps: unknown[], initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const runQuery = useEffectEvent(() => query());

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      runQuery()
        .then((result) => {
          if (!active) return;
          setData(result);
          setLoading(false);
        })
        .catch((e) => {
          if (active) setLoading(false);
          console.warn('[useLive]', e);
        });
    };

    run();
    // Agrupa ráfagas de cambios en una sola recarga.
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 30);
    };
    listeners.add(schedule);
    const unsubscribeFocus = subscribeToFocus(schedule);

    return () => {
      active = false;
      clearTimeout(timer);
      listeners.delete(schedule);
      unsubscribeFocus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
