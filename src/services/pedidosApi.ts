// ─── Capa de Servicios: E-commerce de Ropa (API Mock Robusta) ─────
//
// Centraliza toda la comunicación con la API (/v1/).
// Soporta sincronización en memoria + persistencia web (localStorage),
// idempotencia por solicitud, detección de duplicados y descuento atómico
// de stock cuando se crea un pedido con variantes SKU.

import {
  CrearPedidoOpciones,
  EstadoPedido,
  FLUJO_ESTADOS,
  ItemPedido,
  Pedido,
} from "../types/pedido";
import { CONFIG } from "../constants/config";
import {
  calcularTotalesChile,
  registrarPedidoEnCliente,
  validarYDescontarStockAtomico,
} from "./operacionesMock";

const STORAGE_KEY = "deliverytracker_pedidos_v3";
const VENTANA_DUPLICADO_MS = 3 * 60 * 1000;

// Garantizar inicio limpio en blanco al arrancar
if (typeof window !== "undefined" && window.localStorage) {
  try {
    window.localStorage.removeItem("deliverytracker_pedidos_v1");
    window.localStorage.removeItem("deliverytracker_pedidos_v2");
    window.localStorage.removeItem("deliverytracker_pedidos_v3");
  } catch { }
}

type Listener = () => void;
const listeners = new Set<Listener>();
const idempotencyProcesadas = new Set<string>();

function notificarCambio() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn("Error en listener de pedidos:", e);
    }
  });

  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent !== "undefined"
  ) {
    try {
      window.dispatchEvent(new CustomEvent("pedidos_actualizados"));
    } catch { }
  }
}

export function suscribirACambios(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let pedidosCache: Record<string, Pedido> = {};

function cargarDesdeStorage(): Record<string, Pedido> {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("No se pudo leer de localStorage:", e);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch { }
    }
  }
  return pedidosCache;
}

function guardarEnStorage(nuevos: Record<string, Pedido>) {
  pedidosCache = nuevos;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  }
  notificarCambio();
}

function inicializarAlmacen() {
  pedidosCache = cargarDesdeStorage();
}

inicializarAlmacen();

if (
  typeof window !== "undefined" &&
  typeof window.addEventListener === "function"
) {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      pedidosCache = cargarDesdeStorage();
      notificarCambio();
    }
  });
  window.addEventListener("pedidos_actualizados", () => {
    pedidosCache = cargarDesdeStorage();
  });
}

function generarCodigo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const actuales = cargarDesdeStorage();
  let reintentos = 0;

  while (reintentos < 10) {
    let codigo = "";
    for (let i = 0; i < 4; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!actuales[codigo]) {
      return codigo;
    }
    reintentos++;
  }

  return "O" + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function simularLatencia(): Promise<void> {
  const ms = 80 + Math.random() * 150;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ConflictoStock {
  sku: string;
  nombre: string;
  talla?: string;
  solicitado: number;
  disponible: number;
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  errorCode?: "VALIDATION" | "IDEMPOTENCY_DUPLICATE" | "INSUFFICIENT_STOCK";
  conflictosStock?: ConflictoStock[];
  headers?: Record<string, string>;
}

function respuesta<T>(
  status: number,
  data: T,
  extra?: Pick<ApiResponse<T>, "errorCode" | "conflictosStock">
): ApiResponse<T> {
  return {
    ok: status >= 200 && status < 300,
    status,
    data,
    errorCode: extra?.errorCode,
    conflictosStock: extra?.conflictosStock,
    headers: {
      "X-Api-Version": "1.0.0",
      "X-Store": CONFIG.storeName,
    },
  };
}

/** GET /v1/pedidos */
export async function obtenerPedidos(): Promise<ApiResponse<Pedido[]>> {
  await simularLatencia();
  const datos = cargarDesdeStorage();
  return respuesta(200, Object.values(datos));
}

/** GET /v1/pedidos/:codigo */
export async function obtenerPedidoPorCodigo(
  codigo: string
): Promise<ApiResponse<Pedido | null>> {
  await simularLatencia();
  const datos = cargarDesdeStorage();
  const pedido = datos[codigo.trim().toUpperCase()];

  if (!pedido) {
    return respuesta(404, null);
  }

  return respuesta(200, pedido);
}

/** Detecta pedido idéntico reciente (< 3 min) para evitar duplicados. */
export function detectarDuplicadoReciente(
  clienteNombre: string,
  totalEstimado: number,
  clienteId?: string
): Pedido | null {
  const ahoraMs = Date.now();
  const nombreNorm = clienteNombre.trim().toLowerCase();
  const pedidos = Object.values(cargarDesdeStorage());

  return (
    pedidos.find((p) => {
      const edadMs = ahoraMs - new Date(p.creadoEn).getTime();
      if (edadMs > VENTANA_DUPLICADO_MS) return false;
      const mismoCliente = clienteId
        ? p.clienteId === clienteId
        : p.clienteNombre.trim().toLowerCase() === nombreNorm;
      return mismoCliente && Math.abs(p.totalEstimado - totalEstimado) <= 1;
    }) ?? null
  );
}

/** POST /v1/pedidos */
export async function crearPedido(
  clienteNombre: string,
  direccionDespacho: string,
  comuna: string,
  items: ItemPedido[],
  metodoEnvio: string = "Courier Express 24h",
  opciones?: CrearPedidoOpciones
): Promise<ApiResponse<Pedido>> {
  await simularLatencia();

  if (!clienteNombre.trim() || items.length === 0) {
    return respuesta(400, null as unknown as Pedido, {
      errorCode: "VALIDATION",
    });
  }

  if (opciones?.idempotencyKey && idempotencyProcesadas.has(opciones.idempotencyKey)) {
    return respuesta(409, null as unknown as Pedido, {
      errorCode: "IDEMPOTENCY_DUPLICATE",
    });
  }

  if (items.some((it) => Boolean(it.sku))) {
    const resultadoStock = validarYDescontarStockAtomico(items);
    if (!resultadoStock.ok) {
      return respuesta(409, null as unknown as Pedido, {
        errorCode: "INSUFFICIENT_STOCK",
        conflictosStock: resultadoStock.conflictos,
      });
    }
  }

  if (opciones?.idempotencyKey) {
    idempotencyProcesadas.add(opciones.idempotencyKey);
  }

  const ahora = new Date().toISOString();
  const subtotalItems = items.reduce(
    (acc, it) => acc + (it.precioUnitario ?? 19990) * it.cantidad,
    0
  );

  const usarDesgloseAdmin = Boolean(opciones?.creadoPorAdmin);
  const desglose = usarDesgloseAdmin
    ? calcularTotalesChile(subtotalItems)
    : null;

  const totalEstimado = desglose ? desglose.total : subtotalItems;
  const codigo = generarCodigo();

  const nuevo: Pedido = {
    codigo,
    clienteId: opciones?.clienteId,
    clienteNombre: clienteNombre.trim(),
    clienteEmail: opciones?.clienteEmail,
    clienteTelefono: opciones?.clienteTelefono,
    direccionDespacho:
      direccionDespacho.trim() || "Retiro en Tienda / Por confirmar",
    comuna: comuna.trim() || "Santiago",
    items,
    metodoEnvio: opciones?.transportista
      ? `${opciones.transportista}${opciones.ventanaHoraria ? ` · ${opciones.ventanaHoraria}` : ""}`
      : metodoEnvio,
    transportista: opciones?.transportista,
    ventanaHoraria: opciones?.ventanaHoraria,
    notaInterna: opciones?.notaInterna?.trim() || undefined,
    subtotal: desglose ? desglose.subtotal : subtotalItems,
    ivaIncluido: desglose?.ivaIncluido,
    costoEnvio: desglose ? desglose.envio : opciones?.costoEnvio,
    metodoPago: opciones?.metodoPago,
    totalEstimado,
    estado: "recibido",
    creadoEn: ahora,
    actualizadoEn: ahora,
    creadoPorAdmin: opciones?.creadoPorAdmin,
    idempotencyKey: opciones?.idempotencyKey,
  };

  const actuales = cargarDesdeStorage();
  const actualizados = { ...actuales, [nuevo.codigo]: nuevo };
  guardarEnStorage(actualizados);
  registrarPedidoEnCliente(opciones?.clienteId, nuevo.codigo);

  return respuesta(201, nuevo);
}

/** PATCH /v1/pedidos/:codigo/estado */
export async function avanzarEstado(
  codigo: string
): Promise<ApiResponse<Pedido | null>> {
  await simularLatencia();

  const codigoNormalizado = codigo.trim().toUpperCase();
  const actuales = cargarDesdeStorage();
  const pedido = actuales[codigoNormalizado];

  if (!pedido) {
    return respuesta(404, null);
  }

  const indiceActual = FLUJO_ESTADOS.indexOf(pedido.estado);
  if (indiceActual === FLUJO_ESTADOS.length - 1) {
    return respuesta(409, pedido);
  }

  const nuevoEstado: EstadoPedido = FLUJO_ESTADOS[indiceActual + 1];
  const actualizado: Pedido = {
    ...pedido,
    estado: nuevoEstado,
    actualizadoEn: new Date().toISOString(),
  };

  const actualizados = { ...actuales, [codigoNormalizado]: actualizado };
  guardarEnStorage(actualizados);

  return respuesta(200, actualizado);
}

/** Vaciar todas las órdenes y resetear el almacén en blanco */
export async function vaciarPedidos(): Promise<ApiResponse<Pedido[]>> {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  pedidosCache = {};
  idempotencyProcesadas.clear();
  guardarEnStorage({});
  return respuesta(200, []);
}

export const resetearSemilla = vaciarPedidos;
