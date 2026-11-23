import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { validarCredencialesDemo } from "../services/demoAuth";

type Estado = "cargando" | "invitado" | "autenticado";

type Sesion = {
  estado: Estado;
  ingresar: (correo: string, clave: string) => Promise<boolean>;
  salir: () => Promise<void>;
};

const Contexto = createContext<Sesion | undefined>(undefined);
const CLAVE_ALMACEN = "ateliernoir_demo_operador_v1";

export function ProveedorSesionDemo({
  children,
}: {
  children: React.ReactNode;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    let activo = true;

    AsyncStorage.getItem(CLAVE_ALMACEN)
      .then((valor) => {
        if (activo) {
          setEstado(
            valor === "si" ? "autenticado" : "invitado"
          );
        }
      })
      .catch(() => {
        if (activo) setEstado("invitado");
      });

    return () => {
      activo = false;
    };
  }, []);

  const ingresar = useCallback(
    async (correo: string, clave: string) => {
      if (!validarCredencialesDemo(correo, clave)) {
        return false;
      }

      try {
        await AsyncStorage.setItem(CLAVE_ALMACEN, "si");
      } catch {
        // La demo puede continuar sin persistencia.
      }

      setEstado("autenticado");
      return true;
    },
    []
  );

  const salir = useCallback(async () => {
    setEstado("invitado");

    try {
      await AsyncStorage.removeItem(CLAVE_ALMACEN);
    } catch {
      // La sesion visual ya fue cerrada.
    }
  }, []);

  const valor = useMemo(
    () => ({ estado, ingresar, salir }),
    [estado, ingresar, salir]
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
    </Contexto.Provider>
  );
}

export function useSesionDemo(): Sesion {
  const valor = useContext(Contexto);

  if (!valor) {
    throw new Error("Falta ProveedorSesionDemo");
  }

  return valor;
}
