// ─── Contexto de pedidos ─────────────────────────────────────────
//
// Fuente única de verdad compartida entre Bodega/Admin y Cliente.
// Mantiene estado discriminado, suscripción reactiva al catálogo y
// analítica agregada en una sola pasada O(P + V).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  avanzarEstado,
  ConflictoStock,
  crearPedido,
  obtenerPedidos,
  suscribirACambios,
} from "../services/pedidosApi";
import {
  calcularAnaliticaOperacion,
  obtenerCatalogoConStock,
  reponerStockSku,
  suscribirStock,
} from "../services/operacionesMock";
import {
  AnaliticaOperacion,
  CrearPedidoOpciones,
  EstadoUI,
  ItemPedido,
  Pedido,
  ProductoCatalogoAdmin,
} from "../types/pedido";

export interface EstadisticasPedidos {
  total: number;
  activos: number;
  entregados: number;
}

export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  pedido?: Pedido;
  errorCode?: "VALIDATION" | "IDEMPOTENCY_DUPLICATE" | "INSUFFICIENT_STOCK";
  conflictosStock?: ConflictoStock[];
}

interface ValorPedidos {
  estado: EstadoUI<Pedido[]>;
  pedidos: Pedido[];
  catalogo: ProductoCatalogoAdmin[];
  analitica: AnaliticaOperacion;
  estadisticas: EstadisticasPedidos;
  refrescando: boolean;
  ultimaActualizacion: number | null;
  recargar: () => Promise<void>;
  crearOrden: (
    nombre: string,
    direccion: string,
    comuna: string,
    items: ItemPedido[],
    metodoEnvio?: string,
    opciones?: CrearPedidoOpciones
  ) => Promise<ResultadoAccion>;
  avanzar: (codigo: string) => Promise<ResultadoAccion>;
  reponerStock: (sku: string, cantidad: number) => number | null;
}

const ContextoPedidos = createContext<ValorPedidos | null>(null);

export function ProveedorPedidos({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoUI<Pedido[]>>({
    tipo: "cargando",
  });
  const [catalogo, setCatalogo] = useState<ProductoCatalogoAdmin[]>(() =>
    obtenerCatalogoConStock()
  );
  const [refrescando, setRefrescando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<number | null>(
    null
  );
  const recargaSeqRef = useRef(0);
  const omitirSiguienteEventoRef = useRef(false);

  const recargar = useCallback(async () => {
    const seq = ++recargaSeqRef.current;
    await Promise.resolve();
    if (seq !== recargaSeqRef.current) return;
    setRefrescando(true);
    try {
      const res = await obtenerPedidos();
      if (seq !== recargaSeqRef.current) return;
      if (!res.ok) {
        setEstado({
          tipo: "error",
          mensaje: `No se pudo conectar con el servidor (${res.status}).`,
        });
        return;
      }
      const ordenados = [...res.data].sort(
        (a, b) =>
          new Date(b.actualizadoEn).getTime() -
          new Date(a.actualizadoEn).getTime()
      );
      setEstado(
        ordenados.length === 0
          ? { tipo: "vacio" }
          : { tipo: "datos", datos: ordenados }
      );
      setUltimaActualizacion(Date.now());
    } catch {
      if (seq !== recargaSeqRef.current) return;
      setEstado({
        tipo: "error",
        mensaje: "Error de red al consultar los despachos.",
      });
    } finally {
      if (seq === recargaSeqRef.current) {
        setRefrescando(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    const inicializar = async () => {
      try {
        await recargar();
      } catch {
        if (!cancelado) {
          setEstado({
            tipo: "error",
            mensaje: "Error de red al consultar los despachos.",
          });
        }
      }
    };
    inicializar();

    const unsubPedidos = suscribirACambios(() => {
      if (cancelado) return;
      if (omitirSiguienteEventoRef.current) {
        omitirSiguienteEventoRef.current = false;
        return;
      }
      void recargar();
    });
    const unsubStock = suscribirStock(() => {
      if (!cancelado) setCatalogo(obtenerCatalogoConStock());
    });

    return () => {
      cancelado = true;
      unsubPedidos();
      unsubStock();
    };
  }, [recargar]);

  const crearOrden = useCallback(
    async (
      nombre: string,
      direccion: string,
      comuna: string,
      items: ItemPedido[],
      metodoEnvio?: string,
      opciones?: CrearPedidoOpciones
    ): Promise<ResultadoAccion> => {
      try {
        omitirSiguienteEventoRef.current = true;
        const res = await crearPedido(
          nombre,
          direccion,
          comuna,
          items,
          metodoEnvio,
          opciones
        );
        if (!res.ok) {
          omitirSiguienteEventoRef.current = false;
          return {
            ok: false,
            errorCode: res.errorCode,
            conflictosStock: res.conflictosStock,
            mensaje:
              res.errorCode === "INSUFFICIENT_STOCK"
                ? "El stock disponible cambió mientras armabas el pedido."
                : res.errorCode === "IDEMPOTENCY_DUPLICATE"
                  ? "Este pedido ya fue enviado."
                  : `No se pudo crear la orden (HTTP ${res.status}).`,
          };
        }
        await recargar();
        return { ok: true, codigo: res.data.codigo, pedido: res.data };
      } catch {
        omitirSiguienteEventoRef.current = false;
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
        omitirSiguienteEventoRef.current = true;
        const res = await avanzarEstado(codigo);
        if (!res.ok) {
          omitirSiguienteEventoRef.current = false;
          return {
            ok: false,
            mensaje: `No se pudo actualizar la orden ${codigo} (${res.status}).`,
          };
        }
        await recargar();
        return { ok: true };
      } catch {
        omitirSiguienteEventoRef.current = false;
        return { ok: false, mensaje: "Error de red al actualizar el estado." };
      }
    },
    [recargar]
  );

  const reponerStock = useCallback((sku: string, cantidad: number) => {
    return reponerStockSku(sku, cantidad);
  }, []);

  const pedidos = useMemo(
    () => (estado.tipo === "datos" ? estado.datos : []),
    [estado]
  );

  const analitica = useMemo(
    () => calcularAnaliticaOperacion(pedidos, catalogo),
    [pedidos, catalogo]
  );

  const estadisticas = useMemo<EstadisticasPedidos>(
    () => ({
      total: analitica.total,
      activos: analitica.activos,
      entregados: analitica.entregados,
    }),
    [analitica]
  );

  const valor = useMemo<ValorPedidos>(
    () => ({
      estado,
      pedidos,
      catalogo,
      analitica,
      estadisticas,
      refrescando,
      ultimaActualizacion,
      recargar,
      crearOrden,
      avanzar,
      reponerStock,
    }),
    [
      estado,
      pedidos,
      catalogo,
      analitica,
      estadisticas,
      refrescando,
      ultimaActualizacion,
      recargar,
      crearOrden,
      avanzar,
      reponerStock,
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
