import type { StateStorage } from 'zustand/middleware';

// Web: localStorage. La versión nativa está en storage.native.ts.

const web: StateStorage = {
  getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: (key) => globalThis.localStorage?.removeItem(key),
};

/** Almacenamiento local síncrono para preferencias del dispositivo. */
export const localStore = web;

/** Para la sesión. */
export const secureStore = web;
