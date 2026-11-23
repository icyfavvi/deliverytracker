// ─── Autenticación local (sin servidor) ──────────────────────────
//
// Las cuentas viven en AsyncStorage del dispositivo. La contraseña nunca se
// guarda en claro: se guarda sal aleatoria + hash SHA-256 iterado.
//
// LÍMITE: esto protege la UI, no los datos. Cualquiera con acceso al
// dispositivo puede leer/modificar el almacenamiento. Para seguridad real
// hace falta un backend que valide credenciales.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const CLAVE_USUARIOS = "@deliverytracker/usuarios";
const CLAVE_SESION = "@deliverytracker/sesion";
const ITERACIONES = 2000;
export const MIN_CLAVE = 8;

export interface Sesion {
  usuario: string;
}

interface UsuarioGuardado {
  usuario: string;
  sal: string;
  hash: string;
}

export class ErrorAuth extends Error {}

const normalizar = (usuario: string) => usuario.trim().toLowerCase();

async function derivar(clave: string, sal: string): Promise<string> {
  let h = `${sal}:${clave}`;
  for (let i = 0; i < ITERACIONES; i++) {
    h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, h + sal);
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

export async function registrar(usuario: string, clave: string): Promise<Sesion> {
  const nombre = normalizar(usuario);
  if (nombre.length < 3) throw new ErrorAuth("El usuario debe tener al menos 3 caracteres.");
  if (!/^[a-z0-9._-]+$/.test(nombre))
    throw new ErrorAuth("Usa solo letras, números, punto, guion y guion bajo.");
  if (clave.length < MIN_CLAVE)
    throw new ErrorAuth(`La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`);

  const usuarios = await leerUsuarios();
  if (usuarios.some((u) => u.usuario === nombre))
    throw new ErrorAuth("Ese usuario ya existe.");

  const sal = Crypto.randomUUID();
  const hash = await derivar(clave, sal);
  await AsyncStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify([...usuarios, { usuario: nombre, sal, hash }]),
  );
  return abrirSesion(nombre);
}

export async function iniciarSesion(usuario: string, clave: string): Promise<Sesion> {
  const nombre = normalizar(usuario);
  const guardado = (await leerUsuarios()).find((u) => u.usuario === nombre);
  // Mismo mensaje para usuario inexistente y clave errónea (no filtrar cuentas).
  const hash = await derivar(clave, guardado?.sal ?? "sin-usuario");
  if (!guardado || hash !== guardado.hash)
    throw new ErrorAuth("Usuario o contraseña incorrectos.");
  return abrirSesion(nombre);
}

async function abrirSesion(usuario: string): Promise<Sesion> {
  const sesion: Sesion = { usuario };
  await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion;
}

export async function leerSesion(): Promise<Sesion | null> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE_SESION);
    return crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_SESION);
}
