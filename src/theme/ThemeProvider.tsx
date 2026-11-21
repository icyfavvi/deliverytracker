// ─── Proveedor de tema "Atelier Noir" ────────────────────────────
//
// La app tiene dos paletas (papel claro / tinta oscura). Este contexto
// expone los tokens del modo activo y el interruptor para cambiarlo.
//
// La preferencia se persiste en AsyncStorage para que la app abra siempre
// como el usuario la dejó, no como el sistema la tenga ese día.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ColoresTema,
  ESPACIOS,
  ModoTema,
  PALETAS,
  PUNTO_MINIMO,
  RADIOS,
  TIPOGRAFIA,
  Z_INDEX,
} from "./tokens";

const CLAVE_ALMACEN = "atelier_noir_preferencia_tema";

interface ValorTema {
  modo: ModoTema;
  colores: ColoresTema;
  espaciados: typeof ESPACIOS;
  tipografia: typeof TIPOGRAFIA;
  radios: typeof RADIOS;
  zIndex: typeof Z_INDEX;
  puntoMinimo: number;
  /** Cambia entre claro y oscuro. */
  alternarTema: () => void;
  /** Fija un modo concreto. */
  fijarModo: (modo: ModoTema) => void;
}

const ContextoTema = createContext<ValorTema | null>(null);

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [modo, setModo] = useState<ModoTema>(
    esquemaSistema === "dark" ? "oscuro" : "claro"
  );
  const [preferenciaCargada, setPreferenciaCargada] = useState(false);

  // ─── Cargar preferencia guardada ──────────────────────────────
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_ALMACEN);
        if (vigente && (guardado === "claro" || guardado === "oscuro")) {
          setModo(guardado);
        }
      } catch {
        // Sin almacenamiento disponible: seguimos con la preferencia del sistema.
      } finally {
        if (vigente) setPreferenciaCargada(true);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // ─── Guardar preferencia ──────────────────────────────────────
  useEffect(() => {
    if (!preferenciaCargada) return;
    AsyncStorage.setItem(CLAVE_ALMACEN, modo).catch(() => {
      // La persistencia es un extra: si falla, el tema sigue funcionando.
    });
  }, [modo, preferenciaCargada]);

  const alternarTema = useCallback(() => {
    setModo((previo) => (previo === "claro" ? "oscuro" : "claro"));
  }, []);

  const fijarModo = useCallback((nuevo: ModoTema) => setModo(nuevo), []);

  const valor = useMemo<ValorTema>(
    () => ({
      modo,
      colores: PALETAS[modo],
      espaciados: ESPACIOS,
      tipografia: TIPOGRAFIA,
      radios: RADIOS,
      zIndex: Z_INDEX,
      puntoMinimo: PUNTO_MINIMO,
      alternarTema,
      fijarModo,
    }),
    [modo, alternarTema, fijarModo]
  );

  return (
    <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
  );
}

export function useTema(): ValorTema {
  const contexto = useContext(ContextoTema);
  if (!contexto) {
    throw new Error("useTema debe usarse dentro de <ProveedorTema>.");
  }
  return contexto;
}
