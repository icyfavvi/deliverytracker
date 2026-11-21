// ─── Contexto de pedidos ─────────────────────────────────────────
//
// Fuente única de verdad. Antes cada pantalla cargaba y organizaba su
// propia lista; ahora hay un solo lugar que habla con la API, y las
// pantallas leen estado derivado (conteos, orden) de acá.
//
// Esto también habilita el badge vivo de la barra de pestañas: el número
// de órdenes en ruta es el mismo dato que ve el bodega, no una copia.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  avanzarEstado,
  crearPedido,
  obtenerPedidos,
} from "../services/pedidosApi";
import { EstadoUI, ItemPedido, Pedido } from "../types/pedido";

export interface EstadisticasPedidos {
  total: number;
  activos: number;
  entregados: number;
}

export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
}

interface ValorPedidos {
  /** Estado discriminado de la lista: cargando / error / vacío / datos. */
  estado: EstadoUI<Pedido[]>;
  /** Datos actuales (vacío si no hay). */
  pedidos: Pedido[];
  /** Estado derivado para la UI. */
  estadisticas: EstadisticasPedidos;
  /** Hay una recarga en curso sin perder los datos visibles. */
  refrescando: boolean;
  /** Marca de tiempo de la última carga exitosa. */
  ultimaActualizacion: number | null;
  recargar: () => Promise<void>;
  crearOrden: (
    nombre: string,
    direccion: string,
    comuna: string,
    items: ItemPedido[]
  ) => Promise<ResultadoAccion>;
  avanzar: (codigo: string) => Promise<ResultadoAccion>;
}

const ContextoPedidos = createContext<ValorPedidos | null>(null);

export function ProveedorPedidos({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoUI<Pedido[]>>({ tipo: "cargando" });
  const [refrescando, setRefrescando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<number | null>(null);

  const recargar = useCallback(async () => {
    // Un tick antes de tocar el estado: el primer render no encadena
    // una actualización y evitamos el render en cascada al montar.
    await Promise.resolve();
    setRefrescando(true);
    try {
      const res = await obtenerPedidos();
      if (!res.ok) {
        setEstado({
          tipo: "error",
          mensaje: `No se pudo conectar con el servidor (${res.status}).`,
        });
        return;
      }
      const ordenados = [...res.data].sort(
        (a, b) =>
          new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
      );
      setEstado(
        ordenados.length === 0 ? { tipo: "vacio" } : { tipo: "datos", datos: ordenados }
      );
      setUltimaActualizacion(Date.now());
    } catch {
      setEstado({
        tipo: "error",
        mensaje: "Error de red al consultar los despachos.",
      });
    } finally {
      setRefrescando(false);
    }
  }, []);

  // ─── Carga inicial ────────────────────────────────────────────
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await obtenerPedidos();
        if (cancelado) return;
        if (!res.ok) {
          setEstado({
            tipo: "error",
            mensaje: `Error al conectar con la base de datos (${res.status}).`,
          });
          return;
        }
        if (res.data.length === 0) {
          setEstado({ tipo: "vacio" });
        } else {
          const ordenados = [...res.data].sort(
            (a, b) =>
              new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
          );
          setEstado({ tipo: "datos", datos: ordenados });
        }
      } catch {
        if (!cancelado) {
          setEstado({
            tipo: "error",
            mensaje: "Error de red al consultar los despachos.",
          });
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const crearOrden = useCallback(
    async (
      nombre: string,
      direccion: string,
      comuna: string,
      items: ItemPedido[]
    ): Promise<ResultadoAccion> => {
      try {
        const res = await crearPedido(nombre, direccion, comuna, items);
        if (!res.ok) {
          return {
            ok: false,
            mensaje: `No se pudo crear la orden (HTTP ${res.status}).`,
          };
        }
        await recargar();
        return { ok: true, codigo: res.data.codigo };
      } catch {
        return {
          ok: false,
          mensaje: "Fallo de conexión al enviar el pedido al servidor.",
        };
      }
    },
    [recargar]
  );

  const avanzar = useCallback(
    async (codigo: string): Promise<ResultadoAccion> => {
      try {
        const res = await avanzarEstado(codigo);
        if (!res.ok) {
          return {
            ok: false,
            mensaje: `No se pudo actualizar la orden ${codigo} (${res.status}).`,
          };
        }
        await recargar();
        return { ok: true };
      } catch {
        return { ok: false, mensaje: "Error de red al actualizar el estado." };
      }
    },
    [recargar]
  );

  // La lista vive memorizada: si se recreara en cada render, los
  // cálculos derivados de abajo se rehacerían sin necesidad.
  const pedidos = useMemo(
    () => (estado.tipo === "datos" ? estado.datos : []),
    [estado]
  );

  const estadisticas = useMemo<EstadisticasPedidos>(() => {
    const total = pedidos.length;
    const activos = pedidos.filter((p) => p.estado !== "entregado").length;
    const entregados = total - activos;
    return { total, activos, entregados };
  }, [pedidos]);

  const valor = useMemo<ValorPedidos>(
    () => ({
      estado,
      pedidos,
      estadisticas,
      refrescando,
      ultimaActualizacion,
      recargar,
      crearOrden,
      avanzar,
    }),
    [
      estado,
      pedidos,
      estadisticas,
      refrescando,
      ultimaActualizacion,
      recargar,
      crearOrden,
      avanzar,
    ]
  );

  return (
    <ContextoPedidos.Provider value={valor}>{children}</ContextoPedidos.Provider>
  );
}

export function usePedidos(): ValorPedidos {
  const contexto = useContext(ContextoPedidos);
  if (!contexto) {
    throw new Error("usePedidos debe usarse dentro de <ProveedorPedidos>.");
  }
  return contexto;
}
