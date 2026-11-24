// ─── Contexto de sesión ──────────────────────────────────────────
//
// Expone quién está dentro y las acciones de entrar, registrarse y salir.
// `cargando` es true solo mientras se restaura la sesión guardada.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as auth from "../services/authLocal";
import type { Sesion } from "../services/authLocal";

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
    auth.leerSesion().then((s) => {
      setSesion(s);
      setCargando(false);
    });
  }, []);

  const entrar = useCallback(async (u: string, c: string) => {
    setSesion(await auth.iniciarSesion(u, c));
  }, []);
  const registrarse = useCallback(async (u: string, c: string) => {
    setSesion(await auth.registrar(u, c));
  }, []);
  const salir = useCallback(async () => {
    await auth.cerrarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({ sesion, cargando, entrar, registrarse, salir }),
    [sesion, cargando, entrar, registrarse, salir],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): ValorAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <ProveedorAuth>");
  return ctx;
}
