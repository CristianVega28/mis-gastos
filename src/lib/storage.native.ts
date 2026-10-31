import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

/** Almacenamiento local síncrono para preferencias del dispositivo (kv-store de SQLite). */
export const localStore: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};

/** Para la sesión: llavero del sistema. */
export const secureStore: StateStorage = {
  getItem: (key) => SecureStore.getItem(key),
  setItem: (key, value) => SecureStore.setItem(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
