import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuth } from '@/store/auth';

/**
 * URL de la API:
 * - EXPO_PUBLIC_API_URL si está definida (builds de la app nativa).
 * - Web en producción: el mismo dominio (`/api`), que Caddy reenvía al backend.
 * - Desarrollo: el mismo host que el servidor de Expo, puerto 8080.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') {
    return __DEV__ ? `http://${window.location.hostname}:8080/api` : '/api';
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:8080/api`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    /** 0 = sin conexión */
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Sin token (login y registro) */
  anonymous?: boolean;
};

export async function api<T>(path: string, { method = 'GET', body, query, anonymous }: Options = {}): Promise<T> {
  const qs = query
    ? '?' +
      Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const token = useAuth.getState().token;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token && !anonymous) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Sesión vencida o inválida: vuelve al login
    if (res.status === 401 && !anonymous) useAuth.getState().signOut();
    throw new ApiError(data?.error ?? `Error ${res.status}`, res.status, data?.field);
  }
  return data as T;
}
