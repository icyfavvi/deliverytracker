// ─── Hook de Estado y Flujos para LocalScreen (Bodega) ──────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { TonoAviso } from "../AvisoFlotante";
import { PortalNavItem } from "../PortalShell";
import { useAuth } from "../../context/AuthContext";
import { usePedidos } from "../../context/PedidosContext";
import { usePedidoPolling } from "../../hooks/usePedidoPolling";
import { useReducirMovimiento } from "../../hooks/useReducirMovimiento";
import { ADMIN_DEMO } from "../../services/authLocal";
import { vaciarPedidos } from "../../services/pedidosApi";
import { ItemPedido } from "../../types/pedido";
import {
  dispararNotificacionError,
  dispararNotificacionExito,
} from "../../utils/haptics";
import { sanitizarInput } from "../../utils/sanitize";
import { PrendaRapidaSku } from "./CatalogoSKU";

export type VistaAdmin =
  | "resumen"
  | "bodega"
  | "pedidos"
  | "despachos"
  | "seguimiento";

const TALLA_PREDETERMINADA = "M";
const PRECIO_MANUAL = 29990;

export interface AvisoAccion {
  titulo: string;
  mensaje: string;
  tono: TonoAviso;
  accion?: { etiqueta: string; icono?: "copy"; onPress: () => void };
}

export function useLocalEstado() {
  const reducirMovimiento = useReducirMovimiento();
  const { sesion } = useAuth();
  const {
    estado,
    pedidos,
    catalogo,
    analitica,
    estadisticas,
    recargar,
    crearOrden,
    avanzar,
    cancelar,
    reponerStock,
    refrescando,
  } = usePedidos();

  const esAdmin = sesion?.rol === "admin";
  const nombreUsuario =
    sesion?.usuario === ADMIN_DEMO.usuario
      ? ADMIN_DEMO.nombreVisible
      : (sesion?.usuario ?? "Operador Bodega");
  const rolUsuario = esAdmin ? ADMIN_DEMO.cargo : "Operador / Despachos";
  const inicialesUsuario =
    nombreUsuario
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "OP";

  const [vista, setVista] = useState<VistaAdmin>(
    esAdmin ? "resumen" : "pedidos"
  );
  const vistaActiva: VistaAdmin =
    !esAdmin && (vista === "resumen" || vista === "bodega")
      ? "pedidos"
      : vista;
  const [busquedaGlobal, setBusquedaGlobal] = useState("");

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [itemNombreManual, setItemNombreManual] = useState("");
  const [tallaManual, setTallaManual] = useState(TALLA_PREDETERMINADA);
  const [creando, setCreando] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoAccion | null>(null);

  const [enFoco, setEnFoco] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnFoco(true);
      return () => setEnFoco(false);
    }, [])
  );

  usePedidoPolling({
    fetchFn: recargar,
    enabled: enFoco,
    escucharEventos: false,
    intervaloInicial: 8_000,
    intervaloLargo: 25_000,
  });

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const catalogoRapido = useMemo<PrendaRapidaSku[]>(
    () =>
      catalogo.map((prod) => {
        const varActiva =
          prod.variantes.find((v) => v.stock > 0) ?? prod.variantes[0];
        return {
          id: prod.id,
          sku: varActiva.sku,
          nombre: prod.nombre,
          talla: varActiva.talla,
          color: prod.color,
          precio: prod.precio,
          stock: varActiva.stock,
        };
      }),
    [catalogo]
  );

  const stockPorSku = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const prod of catalogo) {
      for (const v of prod.variantes) mapa[v.sku] = v.stock;
    }
    return mapa;
  }, [catalogo]);

  const pedidosFiltrados = useMemo(() => {
    const q = busquedaGlobal.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.comuna.toLowerCase().includes(q) ||
        p.items.some((i) => i.nombre.toLowerCase().includes(q))
    );
  }, [pedidos, busquedaGlobal]);

  const estadoPedidosFiltrados = useMemo(() => {
    if (estado.tipo !== "datos") return estado;
    if (pedidosFiltrados.length === 0) return { tipo: "vacio" as const };
    return { tipo: "datos" as const, datos: pedidosFiltrados };
  }, [estado, pedidosFiltrados]);

  const totalEstimado = useMemo(
    () =>
      items.reduce(
        (acumulado, item) =>
          acumulado + (item.precioUnitario ?? PRECIO_MANUAL) * item.cantidad,
        0
      ),
    [items]
  );
  const cantidadPrendas = useMemo(
    () => items.reduce((acumulado, item) => acumulado + item.cantidad, 0),
    [items]
  );

  const agregarPrendaCatalogo = (cat: PrendaRapidaSku) => {
    if (cat.stock <= 0) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorItems(`${cat.nombre} (${cat.talla}) sin stock disponible.`);
      return;
    }
    const actualEnCarrito =
      items.find((it) => it.sku === cat.sku)?.cantidad ?? 0;
    if (actualEnCarrito >= cat.stock) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorItems(
        `Stock máximo alcanzado para ${cat.nombre} (${cat.stock} un.).`
      );
      return;
    }
    setItems((previos) => {
      const indice = previos.findIndex((item) => item.sku === cat.sku);
      if (indice >= 0) {
        if (previos[indice].cantidad >= cat.stock) return previos;
        const copia = [...previos];
        copia[indice] = {
          ...copia[indice],
          cantidad: copia[indice].cantidad + 1,
        };
        return copia;
      }
      return [
        ...previos,
        {
          sku: cat.sku,
          nombre: cat.nombre,
          cantidad: 1,
          talla: cat.talla,
          color: cat.color,
          precioUnitario: cat.precio,
        },
      ];
    });
    setErrorItems(null);
  };

  const agregarItemManual = () => {
    const texto = sanitizarInput(itemNombreManual);
    if (!texto) return;
    setItems((previos) => [
      ...previos,
      {
        nombre: texto,
        cantidad: 1,
        talla: sanitizarInput(tallaManual) || TALLA_PREDETERMINADA,
        color: "Estándar",
        precioUnitario: PRECIO_MANUAL,
      },
    ]);
    setItemNombreManual("");
    setErrorItems(null);
  };

  const cambiarCantidad = (indice: number, delta: number) => {
    const item = items[indice];
    if (!item) return;
    if (delta > 0 && item.sku) {
      const maxStock = stockPorSku[item.sku] ?? 0;
      if (item.cantidad + delta > maxStock) {
        void dispararNotificacionError(reducirMovimiento);
        setErrorItems(
          `Stock disponible para ${item.nombre}: ${maxStock} un.`
        );
        return;
      }
    }
    setItems((previos) =>
      previos
        .map((it, i) =>
          i === indice
            ? { ...it, cantidad: Math.max(1, it.cantidad + delta) }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );
    setErrorItems(null);
  };

  const eliminarItem = (indice: number) => {
    setItems((previos) => previos.filter((_, i) => i !== indice));
  };

  const handleCrearPedido = useCallback(async () => {
    const nombreSanitizado = sanitizarInput(nombre);
    if (!nombreSanitizado) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorNombre("Ingresa el nombre de quien recibe el pedido.");
      return;
    }
    if (items.length === 0) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorItems("Agrega al menos una prenda al paquete.");
      return;
    }
    setErrorNombre(null);
    setErrorItems(null);
    setCreando(true);
    try {
      const resultado = await crearOrden(
        nombreSanitizado,
        sanitizarInput(direccion) || "Av. Providencia 1240, Dpto 502",
        sanitizarInput(comuna),
        items
      );
      if (!resultado.ok) {
        void dispararNotificacionError(reducirMovimiento);
        setAviso({
          titulo: "No se pudo crear la orden",
          mensaje: resultado.mensaje ?? "Error desconocido al guardar.",
          tono: "error",
        });
        return;
      }
      void dispararNotificacionExito(reducirMovimiento);
      const codigo = resultado.codigo ?? "";
      setNombre("");
      setDireccion("");
      setComuna("");
      setItems([]);
      setAviso({
        titulo: `Orden #${codigo} creada`,
        mensaje: "Ya está visible para el cliente en el rastreo.",
        tono: "exito",
        accion: {
          etiqueta: "Copiar",
          icono: "copy",
          onPress: () => {
            Clipboard.setStringAsync(codigo).catch(() => {});
            setAviso((previo) =>
              previo
                ? {
                    ...previo,
                    accion: undefined,
                    mensaje: "Código copiado al portapapeles.",
                  }
                : previo
            );
          },
        },
      });
    } finally {
      setCreando(false);
    }
  }, [nombre, direccion, comuna, items, crearOrden, reducirMovimiento]);

  const handleAvanzarEstado = useCallback(
    async (codigo: string) => {
      const resultado = await avanzar(codigo);
      if (!resultado.ok) {
        void dispararNotificacionError(reducirMovimiento);
        setAviso({
          titulo: "No se pudo actualizar",
          mensaje: resultado.mensaje ?? "Error de red al actualizar el estado.",
          tono: "error",
        });
        return;
      }
      void dispararNotificacionExito(reducirMovimiento);
    },
    [avanzar, reducirMovimiento]
  );

  const handleCancelarPedido = useCallback(
    async (codigo: string) => {
      const resultado = await cancelar(codigo, "Cancelado por bodega");
      if (!resultado.ok) {
        void dispararNotificacionError(reducirMovimiento);
        setAviso({
          titulo: "No se pudo cancelar",
          mensaje: resultado.mensaje ?? "Error de red al cancelar la orden.",
          tono: "error",
        });
        return;
      }
      void dispararNotificacionExito(reducirMovimiento);
      setAviso({
        titulo: `Orden #${codigo} cancelada`,
        mensaje: "Las prendas volvieron al stock de bodega.",
        tono: "exito",
      });
    },
    [cancelar, reducirMovimiento]
  );

  const handleCopiarCodigo = useCallback(async (codigo: string) => {
    await Clipboard.setStringAsync(codigo).catch(() => {});
    setAviso({
      titulo: `Código #${codigo} copiado`,
      mensaje: "Pégalo en el chat con el cliente.",
      tono: "info",
    });
  }, []);

  const handleVaciarOrdenes = useCallback(async () => {
    await vaciarPedidos();
    await recargar();
    setAviso({
      titulo: "Lista de pedidos vaciada",
      mensaje: "Se eliminaron todas las órdenes registradas.",
      tono: "info",
    });
  }, [recargar]);

  const handleReponerStock = useCallback(
    (sku: string, cantidad: number) => {
      const nuevo = reponerStock(sku, cantidad);
      if (nuevo !== null) {
        void dispararNotificacionExito(reducirMovimiento);
        setAviso({
          titulo: `Stock actualizado (${sku})`,
          mensaje: `Ahora hay ${nuevo} unidad(es) disponibles en bodega.`,
          tono: "exito",
        });
      }
    },
    [reponerStock, reducirMovimiento]
  );

  const irANuevoPedido = useCallback(() => {
    router.push("/nuevo-pedido");
  }, []);

  const navItems: PortalNavItem[] = useMemo(
    () =>
      esAdmin
        ? [
            { id: "resumen", etiqueta: "Resumen", icono: "layout-grid" },
            {
              id: "bodega",
              etiqueta: "Bodega",
              icono: "layers",
              badge: analitica.skusCriticos.length,
            },
            {
              id: "pedidos",
              etiqueta: "Pedidos",
              icono: "package",
              badge: estadisticas.activos,
            },
            { id: "despachos", etiqueta: "Despachos", icono: "truck" },
            { id: "seguimiento", etiqueta: "Seguimiento", icono: "map" },
          ]
        : [
            {
              id: "pedidos",
              etiqueta: "Pedidos",
              icono: "package",
              badge: estadisticas.activos,
            },
            { id: "despachos", etiqueta: "Despachos", icono: "truck" },
            { id: "seguimiento", etiqueta: "Seguimiento", icono: "map" },
          ],
    [esAdmin, analitica.skusCriticos.length, estadisticas.activos]
  );

  return {
    esAdmin,
    nombreUsuario,
    rolUsuario,
    inicialesUsuario,
    vistaActiva,
    setVista,
    busquedaGlobal,
    setBusquedaGlobal,
    nombre,
    setNombre,
    direccion,
    setDireccion,
    comuna,
    setComuna,
    items,
    itemNombreManual,
    setItemNombreManual,
    tallaManual,
    setTallaManual,
    creando,
    errorNombre,
    setErrorNombre,
    errorItems,
    aviso,
    setAviso,
    pedidos,
    analitica,
    estadisticas,
    refrescando,
    recargar,
    catalogoRapido,
    estadoPedidosFiltrados,
    totalEstimado,
    cantidadPrendas,
    agregarPrendaCatalogo,
    agregarItemManual,
    cambiarCantidad,
    eliminarItem,
    handleCrearPedido,
    handleAvanzarEstado,
    handleCancelarPedido,
    handleCopiarCodigo,
    handleVaciarOrdenes,
    handleReponerStock,
    irANuevoPedido,
    navItems,
  };
}
