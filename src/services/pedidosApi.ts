// ─── Capa de Servicios: E-commerce de Ropa (API Mock Robusta) ─────
//
// Centraliza toda la comunicación con la API (/v1/).
// Soporta sincronización en memoria + persistencia web (localStorage)
// para que los cambios en la vista LOCAL se sincronicen de inmediato
// con la vista CLIENTE incluso entre pestañas o al recargar la página.

import {
  Pedido,
  EstadoPedido,
  ItemPedido,
  FLUJO_ESTADOS,
} from "../types/pedido";
import { CONFIG } from "../constants/config";

const STORAGE_KEY = "deliverytracker_pedidos_v3";

// Limpiar versiones anteriores y cualquier orden previa para garantizar inicio limpio en blanco
if (typeof window !== "undefined" && window.localStorage) {
  try {
    window.localStorage.removeItem("deliverytracker_pedidos_v1");
    window.localStorage.removeItem("deliverytracker_pedidos_v2");
    window.localStorage.removeItem("deliverytracker_pedidos_v3");
  } catch {}
}

// ─── Suscriptores reactivos para actualizaciones en vivo ─────────
type Listener = () => void;
const listeners = new Set<Listener>();

function notificarCambio() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn("Error en listener de pedidos:", e);
    }
  });

  // Si estamos en navegador web, disparar evento custom de sincronización
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent !== "undefined"
  ) {
    try {
      window.dispatchEvent(new CustomEvent("pedidos_actualizados"));
    } catch {}
  }
}

export function suscribirACambios(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Almacén sincronizado (Memoria + localStorage) ───────────────
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
      } catch {}
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

// ─── Inicialización limpia del almacén ─────────────────────────
function inicializarAlmacen() {
  const existentes = cargarDesdeStorage();
  pedidosCache = existentes;
}

// Inicializar de inmediato
inicializarAlmacen();

// Escuchar cambios de otras pestañas en web
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
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

// ─── Helpers ─────────────────────────────────────────────────────

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

  // Fallback con marca temporal si el espacio está saturado
  return "O" + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function simularLatencia(): Promise<void> {
  const ms = 80 + Math.random() * 150;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  headers?: Record<string, string>;
}

function respuesta<T>(status: number, data: T): ApiResponse<T> {
  return {
    ok: status >= 200 && status < 300,
    status,
    data,
    headers: {
      "X-Api-Version": "1.0.0",
      "X-Store": CONFIG.storeName,
    },
  };
}

// ─── Endpoints de la Capa de Servicios ───────────────────────────

/** GET /v1/pedidos → Obtiene todos los pedidos (Vista LOCAL / Bodega) */
export async function obtenerPedidos(): Promise<ApiResponse<Pedido[]>> {
  await simularLatencia();
  const datos = cargarDesdeStorage();
  // Estado derivado: array ordenado O(n) derivado del diccionario O(1)
  return respuesta(200, Object.values(datos));
}

/** GET /v1/pedidos/:codigo → Consulta un pedido por código (Vista CLIENTE) */
export async function obtenerPedidoPorCodigo(
  codigo: string
): Promise<ApiResponse<Pedido | null>> {
  await simularLatencia();
  const datos = cargarDesdeStorage();
  const pedido = datos[codigo.trim().toUpperCase()];

  if (!pedido) {
    // 404 Not Found: recurso no existe (estado 'vacio' en UI)
    return respuesta(404, null);
  }

  return respuesta(200, pedido);
}

/** POST /v1/pedidos → Registrar nueva venta de ropa (Vista LOCAL) */
export async function crearPedido(
  clienteNombre: string,
  direccionDespacho: string,
  comuna: string,
  items: ItemPedido[],
  metodoEnvio: string = "Courier Express 24h"
): Promise<ApiResponse<Pedido>> {
  await simularLatencia();

  if (!clienteNombre.trim() || items.length === 0) {
    return respuesta(400, null as unknown as Pedido);
  }

  const ahora = new Date().toISOString();
  const total = items.reduce(
    (acc, it) => acc + (it.precioUnitario ?? 19990) * it.cantidad,
    0
  );

  const nuevo: Pedido = {
    codigo: generarCodigo(),
    clienteNombre: clienteNombre.trim(),
    direccionDespacho: direccionDespacho.trim() || "Retiro en Tienda / Por confirmar",
    comuna: comuna.trim() || "Santiago",
    items,
    metodoEnvio,
    totalEstimado: total,
    estado: "recibido",
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  const actuales = cargarDesdeStorage();
  const actualizados = { ...actuales, [nuevo.codigo]: nuevo };
  guardarEnStorage(actualizados);

  return respuesta(201, nuevo);
}

/** PATCH /v1/pedidos/:codigo/estado → Avanzar ciclo de despacho */
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
    // Ya entregado, conflicto de transición
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

/** Resetear datos y vaciar todas las órdenes */
export async function resetearSemilla(): Promise<ApiResponse<Pedido[]>> {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  pedidosCache = {};
  guardarEnStorage({});
  return respuesta(200, []);
}
