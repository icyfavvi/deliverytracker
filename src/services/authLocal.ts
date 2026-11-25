// ─── Autenticación local (adaptador Expo / React Native) ─────────
//
// Conecta AsyncStorage + expo-crypto sobre `crearServicioAuth`.
// La cuenta demo `admin` / `admin` solo se habilita en desarrollo (`__DEV__`).

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  ADMIN_DEMO,
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

const servicio = crearServicioAuth(
  AsyncStorage,
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
