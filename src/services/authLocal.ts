// ─── Autenticación local (sin servidor) ──────────────────────────
//
// Cuentas persistidas en AsyncStorage con sal aleatoria + SHA-256 iterado.
// Siembra automáticamente el usuario `admin` / `admin` (Operaciones) para
// ingresar a Bodega y gestionar los pedidos de los clientes.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const CLAVE_USUARIOS = "@deliverytracker/usuarios";
const CLAVE_SESION = "@deliverytracker/sesion";
const ITERACIONES = 2000;
export const MIN_CLAVE = 8;

export const ADMIN_DEMO = {
  usuario: "admin",
  clave: "admin",
  nombreVisible: "Valentina Rojas",
  cargo: "Admin / Operaciones",
} as const;

export type RolUsuario = "admin" | "operador";

export interface Sesion {
  usuario: string;
  rol: RolUsuario;
}

interface UsuarioGuardado {
  usuario: string;
  rol?: RolUsuario;
  sal: string;
  hash: string;
}

export class ErrorAuth extends Error { }

const normalizar = (usuario: string) => usuario.trim().toLowerCase();

async function derivar(clave: string, sal: string): Promise<string> {
  let h = `${sal}:${clave}`;
  for (let i = 0; i < ITERACIONES; i++) {
    h = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      h + sal
    );
  }
  return h;
}

async function leerUsuarios(): Promise<UsuarioGuardado[]> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE_USUARIOS);
    return crudo ? (JSON.parse(crudo) as UsuarioGuardado[]) : [];
  } catch {
    return [];
  }
}

let seedAdminPromesa: Promise<void> | null = null;

/** Siembra la cuenta `admin` / `admin` una única vez si aún no existe. */
export function asegurarAdminInicial(): Promise<void> {
  if (!seedAdminPromesa) {
    seedAdminPromesa = (async () => {
      try {
        const usuarios = await leerUsuarios();
        if (usuarios.some((u) => u.usuario === ADMIN_DEMO.usuario)) return;
        const sal = Crypto.randomUUID();
        const hash = await derivar(ADMIN_DEMO.clave, sal);
        await AsyncStorage.setItem(
          CLAVE_USUARIOS,
          JSON.stringify([
            ...usuarios,
            {
              usuario: ADMIN_DEMO.usuario,
              rol: "admin",
              sal,
              hash,
            },
          ])
        );
      } catch {
        seedAdminPromesa = null;
      }
    })();
  }
  return seedAdminPromesa;
}

export async function registrar(
  usuario: string,
  clave: string
): Promise<Sesion> {
  await asegurarAdminInicial();
  const nombre = normalizar(usuario);
  if (nombre.length < 3) {
    throw new ErrorAuth("El usuario debe tener al menos 3 caracteres.");
  }
  if (!/^[a-z0-9._-]+$/.test(nombre)) {
    throw new ErrorAuth(
      "Usa solo letras, números, punto, guion y guion bajo."
    );
  }
  if (clave.length < MIN_CLAVE) {
    throw new ErrorAuth(
      `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`
    );
  }

  const usuarios = await leerUsuarios();
  if (usuarios.some((u) => u.usuario === nombre)) {
    throw new ErrorAuth("Ese usuario ya existe.");
  }

  const sal = Crypto.randomUUID();
  const hash = await derivar(clave, sal);
  const rol: RolUsuario = nombre === "admin" ? "admin" : "operador";
  await AsyncStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify([...usuarios, { usuario: nombre, rol, sal, hash }])
  );
  return abrirSesion(nombre, rol);
}

export async function iniciarSesion(
  usuario: string,
  clave: string
): Promise<Sesion> {
  await asegurarAdminInicial();
  const nombre = normalizar(usuario);
  const guardado = (await leerUsuarios()).find((u) => u.usuario === nombre);
  const hash = await derivar(clave, guardado?.sal ?? "sin-usuario");
  if (!guardado || hash !== guardado.hash) {
    throw new ErrorAuth("Usuario o contraseña incorrectos.");
  }
  const rol: RolUsuario =
    guardado.rol ?? (nombre === "admin" ? "admin" : "operador");
  return abrirSesion(nombre, rol);
}

async function abrirSesion(usuario: string, rol: RolUsuario): Promise<Sesion> {
  const sesion: Sesion = { usuario, rol };
  await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion;
}

export async function leerSesion(): Promise<Sesion | null> {
  await asegurarAdminInicial();
  try {
    const crudo = await AsyncStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const parsed = JSON.parse(crudo) as Partial<Sesion>;
    if (!parsed.usuario) return null;
    return {
      usuario: parsed.usuario,
      rol: parsed.rol ?? (parsed.usuario === "admin" ? "admin" : "operador"),
    };
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_SESION);
}
