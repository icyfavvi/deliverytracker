// ─── Núcleo puro de autenticación local ──────────────────────────
//
// Separa las reglas de negocio y derivación criptográfica del adaptador
// nativo/Expo para poder probar registro, login, roles y sesiones directo
// en Node.js (`tests/verify-core.ts`) sin depender del runtime de Expo.

import { SESSION_TTL_MS } from "../constants/config";

export const CLAVE_USUARIOS = "@deliverytracker/usuarios";
export const CLAVE_SESION = "@deliverytracker/sesion";
export const MIN_CLAVE = 8;
export const MAX_INTENTOS_LOGIN = 5;
export const BLOQUEO_LOGIN_MS = 15 * 60 * 1000;
export const MENSAJE_BLOQUEO_LOGIN = "Demasiados intentos. Espera 15 minutos.";

const ITERACIONES_PBKDF2 = 100_000;
const ITERACIONES_FALLBACK = 150;
const ITERACIONES_LEGADO_V1 = 2_000;

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

export interface AuthStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface AuthCryptoAdapter {
  sha256Hex: (input: string) => Promise<string>;
  randomUuid: () => string;
}

export interface AuthEnvOptions {
  /** Solo en desarrollo se siembra automáticamente `admin` / `admin`. */
  permitirDemoAdmin: boolean;
  /** Reloj inyectable para pruebas deterministas de expiración y bloqueo. */
  ahoraMs?: () => number;
}

export class ErrorAuth extends Error {}

const normalizar = (usuario: string) => usuario.trim().toLowerCase();

function resolverRol(usuario: string, rolGuardado?: RolUsuario): RolUsuario {
  if (rolGuardado === "admin" || rolGuardado === "operador") {
    return rolGuardado;
  }
  return usuario === ADMIN_DEMO.usuario ? "admin" : "operador";
}

function bytesAHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function derivarPbkdf2(clave: string, sal: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === "undefined") return null;

  const enc = new TextEncoder();
  const baseKey = await subtle.importKey(
    "raw",
    enc.encode(clave),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(sal),
      iterations: ITERACIONES_PBKDF2,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return `pbkdf2$${bytesAHex(new Uint8Array(bits))}`;
}

async function derivarRondas(
  clave: string,
  sal: string,
  rondas: number,
  sha256Hex: (input: string) => Promise<string>,
  conPrefijo: boolean
): Promise<string> {
  let h = `${sal}:${clave}`;
  for (let i = 0; i < rondas; i++) {
    h = await sha256Hex(h + sal);
  }
  return conPrefijo ? `sha256$${h}` : h;
}

async function derivarHash(
  clave: string,
  sal: string,
  crypto: AuthCryptoAdapter,
  formatoEsperado?: string
): Promise<string> {
  // Soporta hashes v1 sin prefijo (2000 rondas SHA-256) ya guardados en almacenamiento
  if (
    formatoEsperado &&
    !formatoEsperado.startsWith("pbkdf2$") &&
    !formatoEsperado.startsWith("sha256$")
  ) {
    return derivarRondas(
      clave,
      sal,
      ITERACIONES_LEGADO_V1,
      crypto.sha256Hex,
      false
    );
  }
  if (!formatoEsperado || formatoEsperado.startsWith("pbkdf2$")) {
    const pbkdf2 = await derivarPbkdf2(clave, sal);
    if (pbkdf2) return pbkdf2;
  }
  return derivarRondas(
    clave,
    sal,
    ITERACIONES_FALLBACK,
    crypto.sha256Hex,
    true
  );
}

export function crearServicioAuth(
  storage: AuthStorageAdapter,
  crypto: AuthCryptoAdapter,
  env: AuthEnvOptions
) {
  let seedAdminPromesa: Promise<void> | null = null;
  const ahoraMs = env.ahoraMs ?? Date.now;
  const intentosPorUsuario = new Map<
    string,
    { conteo: number; bloqueadoHasta: number | null }
  >();

  async function leerUsuarios(): Promise<UsuarioGuardado[]> {
    try {
      const crudo = await storage.getItem(CLAVE_USUARIOS);
      return crudo ? (JSON.parse(crudo) as UsuarioGuardado[]) : [];
    } catch {
      return [];
    }
  }

  /** Siembra o actualiza la cuenta demo `admin` / `admin` cuando está habilitada. */
  function asegurarAdminInicial(): Promise<void> {
    if (!env.permitirDemoAdmin) return Promise.resolve();
    if (!seedAdminPromesa) {
      seedAdminPromesa = (async () => {
        try {
          const usuarios = await leerUsuarios();
          const existente = usuarios.find(
            (u) => u.usuario === ADMIN_DEMO.usuario
          );
          const yaEnFormatoActual =
            existente &&
            (existente.hash.startsWith("pbkdf2$") ||
              existente.hash.startsWith("sha256$"));
          if (yaEnFormatoActual) return;

          const sal = crypto.randomUuid();
          const hash = await derivarHash(ADMIN_DEMO.clave, sal, crypto);
          const actualizados = [
            ...usuarios.filter((u) => u.usuario !== ADMIN_DEMO.usuario),
            {
              usuario: ADMIN_DEMO.usuario,
              rol: "admin" as const,
              sal,
              hash,
            },
          ];
          await storage.setItem(CLAVE_USUARIOS, JSON.stringify(actualizados));
        } catch {
          seedAdminPromesa = null;
        }
      })();
    }
    return seedAdminPromesa;
  }

  async function abrirSesion(usuario: string, rol: RolUsuario): Promise<Sesion> {
    const sesion: Sesion = { usuario, rol };
    const sessionExpiry = ahoraMs() + SESSION_TTL_MS;
    await storage.setItem(
      CLAVE_SESION,
      JSON.stringify({ ...sesion, sessionExpiry })
    );
    return sesion;
  }

  async function registrar(usuario: string, clave: string): Promise<Sesion> {
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

    const sal = crypto.randomUuid();
    const hash = await derivarHash(clave, sal, crypto);
    // Primera cuenta en producción (sin demo seed) puede ser admin; cuentas adicionales son operador.
    const rol: RolUsuario =
      !env.permitirDemoAdmin && usuarios.length === 0 ? "admin" : "operador";

    await storage.setItem(
      CLAVE_USUARIOS,
      JSON.stringify([...usuarios, { usuario: nombre, rol, sal, hash }])
    );
    return abrirSesion(nombre, rol);
  }

  async function iniciarSesion(usuario: string, clave: string): Promise<Sesion> {
    await asegurarAdminInicial();
    const nombre = normalizar(usuario);
    const registro = intentosPorUsuario.get(nombre);
    if (registro?.bloqueadoHasta !== null && registro?.bloqueadoHasta !== undefined) {
      if (ahoraMs() < registro.bloqueadoHasta) {
        throw new ErrorAuth(MENSAJE_BLOQUEO_LOGIN);
      }
      intentosPorUsuario.delete(nombre);
    }

    const guardado = (await leerUsuarios()).find((u) => u.usuario === nombre);
    const hash = await derivarHash(
      clave,
      guardado?.sal ?? "sin-usuario",
      crypto,
      guardado?.hash
    );
    if (!guardado || hash !== guardado.hash) {
      const conteo = (intentosPorUsuario.get(nombre)?.conteo ?? 0) + 1;
      if (conteo >= MAX_INTENTOS_LOGIN) {
        intentosPorUsuario.set(nombre, {
          conteo,
          bloqueadoHasta: ahoraMs() + BLOQUEO_LOGIN_MS,
        });
        throw new ErrorAuth(MENSAJE_BLOQUEO_LOGIN);
      }
      intentosPorUsuario.set(nombre, { conteo, bloqueadoHasta: null });
      throw new ErrorAuth("Usuario o contraseña incorrectos.");
    }

    intentosPorUsuario.delete(nombre);
    return abrirSesion(nombre, resolverRol(nombre, guardado.rol));
  }

  async function leerSesion(): Promise<Sesion | null> {
    await asegurarAdminInicial();
    try {
      const crudo = await storage.getItem(CLAVE_SESION);
      if (!crudo) return null;
      const parsed = JSON.parse(crudo) as Partial<Sesion> & {
        sessionExpiry?: unknown;
      };
      if (!parsed.usuario) return null;
      if (
        parsed.sessionExpiry !== undefined &&
        (typeof parsed.sessionExpiry !== "number" ||
          !Number.isFinite(parsed.sessionExpiry) ||
          ahoraMs() > parsed.sessionExpiry)
      ) {
        await cerrarSesion();
        return null;
      }
      return {
        usuario: parsed.usuario,
        rol: resolverRol(parsed.usuario, parsed.rol),
      };
    } catch {
      return null;
    }
  }

  async function cerrarSesion(): Promise<void> {
    await storage.removeItem(CLAVE_SESION);
  }

  return {
    asegurarAdminInicial,
    registrar,
    iniciarSesion,
    leerSesion,
    cerrarSesion,
  };
}
