// ─── Autenticación local (adaptador Expo / React Native) ─────────
//
// Conecta expo-secure-store (iOS/Android) con fallback seguro a
// AsyncStorage (Web) y expo-crypto sobre `crearServicioAuth`.
// La cuenta demo `admin` / `admin` solo se habilita en desarrollo (`__DEV__`).

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  ADMIN_DEMO,
  AuthStorageAdapter,
  crearServicioAuth,
  ErrorAuth,
  MIN_CLAVE,
  RolUsuario,
  Sesion,
} from "./authCore";

export { ADMIN_DEMO, ErrorAuth, MIN_CLAVE };
export type { RolUsuario, Sesion };

export const MODO_DEMO_AUTH =
  typeof __DEV__ !== "undefined" ? __DEV__ : false;

function normalizarClaveSegura(clave: string): string {
  return clave.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+/, "");
}

export function crearAlmacenAuthSeguro(): AuthStorageAdapter {
  let disponibilidadPromesa: Promise<boolean> | null = null;
  const puedeUsarSecureStore = async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    if (!disponibilidadPromesa) {
      disponibilidadPromesa = SecureStore.isAvailableAsync().catch(() => false);
    }
    return disponibilidadPromesa;
  };

  return {
    getItem: async (key) => {
      if (await puedeUsarSecureStore()) {
        const val = await SecureStore.getItemAsync(normalizarClaveSegura(key));
        if (val !== null) return val;
        // Migración transparente si había datos previos en AsyncStorage
        const legado = await AsyncStorage.getItem(key);
        if (legado !== null) {
          await SecureStore.setItemAsync(normalizarClaveSegura(key), legado);
          await AsyncStorage.removeItem(key).catch(() => {});
        }
        return legado;
      }
      return AsyncStorage.getItem(key);
    },
    setItem: async (key, value) => {
      if (await puedeUsarSecureStore()) {
        await SecureStore.setItemAsync(normalizarClaveSegura(key), value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      if (await puedeUsarSecureStore()) {
        await SecureStore.deleteItemAsync(normalizarClaveSegura(key));
      }
      await AsyncStorage.removeItem(key).catch(() => {});
    },
  };
}

const servicio = crearServicioAuth(
  crearAlmacenAuthSeguro(),
  {
    sha256Hex: (input) =>
      Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input),
    randomUuid: () => Crypto.randomUUID(),
  },
  { permitirDemoAdmin: MODO_DEMO_AUTH }
);

export const asegurarAdminInicial = servicio.asegurarAdminInicial;
export const registrar = servicio.registrar;
export const iniciarSesion = servicio.iniciarSesion;
export const leerSesion = servicio.leerSesion;
export const cerrarSesion = servicio.cerrarSesion;
