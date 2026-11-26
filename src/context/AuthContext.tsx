// ─── Contexto de sesión ──────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SESSION_TTL_MS } from "../constants/config";
import * as auth from "../services/authLocal";
import type { Sesion } from "../services/authLocal";

export const CLAVE_SESSION_EXPIRY = "@deliverytracker/session_expiry";

interface ValorAuth {
  sesion: Sesion | null;
  cargando: boolean;
  entrar: (usuario: string, clave: string) => Promise<void>;
  registrarse: (usuario: string, clave: string) => Promise<void>;
  salir: () => Promise<void>;
}

const AuthContext = createContext<ValorAuth | null>(null);

export function ProveedorAuth({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const expRaw = await AsyncStorage.getItem(CLAVE_SESSION_EXPIRY);
        const expNum = expRaw !== null ? Number(expRaw) : null;
        if (expNum !== null && Number.isFinite(expNum) && Date.now() > expNum) {
          await auth.cerrarSesion();
          await AsyncStorage.removeItem(CLAVE_SESSION_EXPIRY);
          if (activo) {
            setSesion(null);
            setCargando(false);
          }
          try {
            router.replace("/");
          } catch {
            // Router aún no montado en tests unitarios
          }
          return;
        }
        const s = await auth.leerSesion();
        if (activo) {
          setSesion(s);
          setCargando(false);
        }
      } catch {
        if (activo) {
          setSesion(null);
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const guardarExpiracion = useCallback(async () => {
    const sessionExpiry = Date.now() + SESSION_TTL_MS;
    await AsyncStorage.setItem(CLAVE_SESSION_EXPIRY, String(sessionExpiry));
  }, []);

  const entrar = useCallback(
    async (u: string, c: string) => {
      const nueva = await auth.iniciarSesion(u, c);
      await guardarExpiracion();
      setSesion(nueva);
    },
    [guardarExpiracion]
  );
  const registrarse = useCallback(
    async (u: string, c: string) => {
      const nueva = await auth.registrar(u, c);
      await guardarExpiracion();
      setSesion(nueva);
    },
    [guardarExpiracion]
  );
  const salir = useCallback(async () => {
    await auth.cerrarSesion();
    await AsyncStorage.removeItem(CLAVE_SESSION_EXPIRY).catch(() => {});
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({ sesion, cargando, entrar, registrarse, salir }),
    [sesion, cargando, entrar, registrarse, salir]
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): ValorAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <ProveedorAuth>");
  return ctx;
}
