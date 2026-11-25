// ─── Capa de Servicios: E-commerce de Ropa (API Mock Robusta) ─────
//
// Centraliza toda la comunicación con la API (/v1/).
// Mantiene índice O(1) en memoria (`pedidosCache`), persistencia en
// `localStorage` (Web) o `AsyncStorage` (iOS/Android), sync multi-pestaña,
// idempotencia acotada y descuento atómico de stock por SKU.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { CONFIG } from "../constants/config";
import {
  CrearPedidoOpciones,
  EstadoPedido,
  FLUJO_ESTADOS,
  ItemPedido,
  Pedido,
} from "../types/pedido";
import {
  calcularTotalesChile,
  registrarPedidoEnCliente,
  restaurarStockAtomico,
  validarYDescontarStockAtomico,
} from "./operacionesMock";

const STORAGE_KEY = "deliverytracker_pedidos_v3";
const VENTANA_DUPLICADO_MS = 3 * 60 * 1000;
const MAX_IDEMPOTENCY_KEYS = 200;

type Listener = () => void;
const listeners = new Set<Listener>();
const idempotencyProcesadas = new Set<string>();

let pedidosCache: Record<string, Pedido> = {};
let almacenListo = false;
let promesaHidratacion: Promise<void> | null = null;

function tieneLocalStorageWeb(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    window.localStorage !== null
  );
}

function usarAsyncStorageNativo(): boolean {
  const esNode =
    typeof process !== "undefined" && Boolean(process.versions?.node);
  return !tieneLocalStorageWeb() && !esNode;
}

function leerLocalStorageWeb(): Record<string, Pedido> | null {
  if (!tieneLocalStorageWeb()) return null;
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Record<string, Pedido>) : {};
  } catch (e) {
    console.warn("No se pudo leer de localStorage:", e);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch { }
    return {};
  }
}

async function asegurarAlmacenListo(): Promise<void> {
  if (almacenListo) return;
  if (tieneLocalStorageWeb()) {
    pedidosCache = leerLocalStorageWeb() ?? {};
    almacenListo = true;
    return;
  }
  if (!usarAsyncStorageNativo()) {
    almacenListo = true;
    return;
  }
  if (!promesaHidratacion) {
    promesaHidratacion = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          pedidosCache = JSON.parse(raw) as Record<string, Pedido>;
        }
      } catch (e) {
        console.warn("No se pudo leer pedidos desde AsyncStorage:", e);
      } finally {
        almacenListo = true;
      }
    })();
  }
  await promesaHidratacion;
}

function notificarCambio() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn("Error en listener de pedidos:", e);
    }
  });
}

export function suscribirACambios(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function persistirAlmacen(nuevos: Record<string, Pedido>) {
  pedidosCache = nuevos;
  almacenListo = true;

  if (tieneLocalStorageWeb()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  } else if (usarAsyncStorageNativo()) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos)).catch((e) => {
      console.warn("No se pudo guardar pedidos en AsyncStorage:", e);
    });
  }

  notificarCambio();
}

// Hidratación síncrona inmediata en Web + escucha multi-pestaña
if (tieneLocalStorageWeb()) {
  pedidosCache = leerLocalStorageWeb() ?? {};
  almacenListo = true;
  if (typeof window.addEventListener === "function") {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        pedidosCache = leerLocalStorageWeb() ?? {};
        notificarCambio();
      }
    });
  }
}

function registrarIdempotencyKey(key: string) {
  if (idempotencyProcesadas.size >= MAX_IDEMPOTENCY_KEYS) {
    const oldest = idempotencyProcesadas.values().next().value;
    if (oldest) idempotencyProcesadas.delete(oldest);
  }
  idempotencyProcesadas.add(key);
}

function generarCodigo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let reintentos = 0;

  while (reintentos < 10) {
    let codigo = "";
    for (let i = 0; i < 4; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!pedidosCache[codigo]) {
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

export interface ApiResponse<T> {
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
  await asegurarAlmacenListo();
  await simularLatencia();
  return respuesta(200, Object.values(pedidosCache));
}

/** GET /v1/pedidos/:codigo */
export async function obtenerPedidoPorCodigo(
  codigo: string
): Promise<ApiResponse<Pedido | null>> {
  await asegurarAlmacenListo();
  await simularLatencia();
  const pedido = pedidosCache[codigo.trim().toUpperCase()];

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

  return (
    Object.values(pedidosCache).find((p) => {
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
  await asegurarAlmacenListo();
  await simularLatencia();

  if (!clienteNombre.trim() || items.length === 0) {
    return respuesta(400, null as unknown as Pedido, {
      errorCode: "VALIDATION",
    });
  }

  if (
    opciones?.idempotencyKey &&
    idempotencyProcesadas.has(opciones.idempotencyKey)
  ) {
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
    registrarIdempotencyKey(opciones.idempotencyKey);
  }

  const ahora = new Date().toISOString();
  const subtotalItems = items.reduce(
    (acc, it) => acc + (it.precioUnitario ?? 0) * it.cantidad,
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
    historialEstados: [{ estado: "recibido", fecha: ahora }],
  };

  persistirAlmacen({ ...pedidosCache, [nuevo.codigo]: nuevo });
  registrarPedidoEnCliente(opciones?.clienteId, nuevo.codigo);

  return respuesta(201, nuevo);
}

/** PATCH /v1/pedidos/:codigo/estado */
export async function avanzarEstado(
  codigo: string
): Promise<ApiResponse<Pedido | null>> {
  await asegurarAlmacenListo();
  await simularLatencia();

  const codigoNormalizado = codigo.trim().toUpperCase();
  const pedido = pedidosCache[codigoNormalizado];

  if (!pedido) {
    return respuesta(404, null);
  }

  // Una orden cancelada es terminal: no admiten avance de estado.
  if (pedido.cancelado) {
    return respuesta(409, pedido);
  }

  const indiceActual = FLUJO_ESTADOS.indexOf(pedido.estado);
  if (indiceActual === FLUJO_ESTADOS.length - 1) {
    return respuesta(409, pedido);
  }

  const ahora = new Date().toISOString();
  const nuevoEstado: EstadoPedido = FLUJO_ESTADOS[indiceActual + 1];
  const actualizado: Pedido = {
    ...pedido,
    estado: nuevoEstado,
    actualizadoEn: ahora,
    historialEstados: [
      ...(pedido.historialEstados ?? []),
      { estado: nuevoEstado, fecha: ahora },
    ],
  };

  persistirAlmacen({ ...pedidosCache, [codigoNormalizado]: actualizado });

  return respuesta(200, actualizado);
}

/**
 * POST /v1/pedidos/:codigo/cancelar
 *
 * Solo admite órdenes en estado `recibido`. La reversión de stock es
 * atómica: primero se repone el inventario y recién después se marca la
 * orden como cancelada con su bitácora de estados.
 */
export async function cancelarPedido(
  codigo: string,
  motivo?: string
): Promise<ApiResponse<Pedido | null>> {
  await asegurarAlmacenListo();
  await simularLatencia();

  const codigoNormalizado = codigo.trim().toUpperCase();
  const pedido = pedidosCache[codigoNormalizado];

  if (!pedido) {
    return respuesta(404, null);
  }

  if (pedido.cancelado || pedido.estado !== "recibido") {
    return respuesta(409, pedido);
  }

  const ahora = new Date().toISOString();

  // 1) Reversión atómica del stock de las variantes reservadas.
  restaurarStockAtomico(pedido.items);

  // 2) Marcado de cancelación + bitácora.
  const actualizado: Pedido = {
    ...pedido,
    cancelado: true,
    canceladoEn: ahora,
    motivoCancelacion: motivo?.trim() || "Cancelado por cliente",
    actualizadoEn: ahora,
    historialEstados: [
      ...(pedido.historialEstados ?? []),
      { estado: "cancelado", fecha: ahora },
    ],
  };

  persistirAlmacen({ ...pedidosCache, [codigoNormalizado]: actualizado });

  return respuesta(200, actualizado);
}

/** Vaciar todas las órdenes y limpiar almacenamiento persistido */
export async function vaciarPedidos(): Promise<ApiResponse<Pedido[]>> {
  pedidosCache = {};
  almacenListo = true;
  idempotencyProcesadas.clear();

  if (tieneLocalStorageWeb()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch { }
  } else if (usarAsyncStorageNativo()) {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch { }
  }

  notificarCambio();
  return respuesta(200, []);
}
