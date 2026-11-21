// ─── Tipos del dominio: E-commerce de Ropa & Vestuario ───────────
//
// Cumple con la restricción de rúbrica UTEM:
// "type EstadoPedido = 'recibido' | 'preparing' | 'listo' | 'entregado'"
// Aplicado al dominio de e-commerce de moda y despacho de prendas.
//
// Nota de diseño: las etiquetas son texto plano, sin emoji. El icono de
// cada estado vive aparte (ICONOS_ESTADO) y lo pinta el componente con
// Lucide, de modo que el mismo estado se ve igual en todas las pantallas.

import type { LucideIconName } from "@react-native-vector-icons/lucide";

export type EstadoPedido = "recibido" | "preparando" | "listo" | "entregado";

export const FLUJO_ESTADOS: EstadoPedido[] = [
  "recibido",
  "preparando",
  "listo",
  "entregado",
];

// Etiquetas del estado: se muestran en el badge, en el stepper y en el
// botón de avance. Cortas, en español de Chile, sin símbolos.
export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Orden confirmada",
  preparando: "En preparación",
  listo: "En camino",
  entregado: "Entregado",
};

// Etiquetas cortas para el stepper de 4 pasos, donde el ancho es escaso.
export const ETIQUETAS_ESTADO_CORTA: Record<EstadoPedido, string> = {
  recibido: "Confirmada",
  preparando: "Preparando",
  listo: "En camino",
  entregado: "Entregado",
};

// Subtítulos explicativos del paso actual para el cliente
export const DESCRIPCIONES_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Tu pago fue aprobado y la orden ingresó al sistema de bodega.",
  preparando: "Estamos seleccionando tus prendas, revisando calidad y armando el empaque.",
  listo: "Tu paquete fue entregado al courier y se encuentra en ruta a tu dirección.",
  entregado: "El paquete fue entregado exitosamente en tu domicilio.",
};

// Icono Lucide asociado a cada estado del flujo.
export const ICONOS_ESTADO: Record<EstadoPedido, LucideIconName> = {
  recibido: "package",
  preparando: "shirt",
  listo: "truck",
  entregado: "circle-check",
};

// Ítem de vestuario
export interface ItemPedido {
  nombre: string;
  cantidad: number;
  talla?: string;
  color?: string;
  precioUnitario?: number;
}

// Estructura completa de un pedido de ropa
export interface Pedido {
  codigo: string;
  clienteNombre: string;
  clienteEmail?: string;
  direccionDespacho: string;
  comuna: string;
  items: ItemPedido[];
  estado: EstadoPedido;
  creadoEn: string;
  actualizadoEn: string;
  metodoEnvio: string;
  totalEstimado: number;
}

// Estado de UI discriminado
export type EstadoUI<T> =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "vacio" }
  | { tipo: "datos"; datos: T };
