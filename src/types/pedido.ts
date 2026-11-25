// ─── Tipos del dominio: Atelier Noir E-commerce & Operaciones ────
//
// Preserva la máquina de estados UTEM (`EstadoPedido`, `FLUJO_ESTADOS`,
// `EstadoUI<T>`) y añade tipado estricto para clientes CRM, variantes SKU
// con stock en vivo, analítica en una sola pasada y creación de pedidos Admin.

import type { LucideIconName } from "@react-native-vector-icons/lucide";

export type EstadoPedido = "recibido" | "preparando" | "listo" | "entregado";

export const FLUJO_ESTADOS: EstadoPedido[] = [
  "recibido",
  "preparando",
  "listo",
  "entregado",
];

export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Confirmado",
  preparando: "En preparación",
  listo: "En camino",
  entregado: "Entregado",
};

export const ETIQUETAS_ESTADO_CORTA: Record<EstadoPedido, string> = {
  recibido: "Confirmado",
  preparando: "Preparando",
  listo: "En camino",
  entregado: "Entregado",
};

export const DESCRIPCIONES_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Tu pago fue aprobado y la orden ingresó al sistema de bodega.",
  preparando:
    "Estamos seleccionando tus prendas, revisando calidad y armando el empaque.",
  listo:
    "Tu paquete fue entregado al courier y se encuentra en ruta a tu dirección.",
  entregado: "El paquete fue entregado exitosamente en tu domicilio.",
};

export const ICONOS_ESTADO: Record<EstadoPedido, LucideIconName> = {
  recibido: "package",
  preparando: "shirt",
  listo: "truck",
  entregado: "circle-check",
};

export type Transportista = "Bluex" | "Starken" | "Chilexpress";
export type MetodoPago = "Transferencia" | "Link de pago" | "Débito / Crédito";
export type TonoProducto = "dark" | "ice" | "cobalt" | "steel";

export interface ItemPedido {
  sku?: string;
  nombre: string;
  cantidad: number;
  talla?: string;
  color?: string;
  precioUnitario?: number;
}

export interface Pedido {
  codigo: string;
  clienteId?: string;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionDespacho: string;
  comuna: string;
  items: ItemPedido[];
  estado: EstadoPedido;
  creadoEn: string;
  actualizadoEn: string;
  metodoEnvio: string;
  transportista?: Transportista;
  ventanaHoraria?: string;
  notaInterna?: string;
  subtotal?: number;
  ivaIncluido?: number;
  costoEnvio?: number;
  metodoPago?: MetodoPago;
  totalEstimado: number;
  creadoPorAdmin?: boolean;
  idempotencyKey?: string;
}

export interface CrearPedidoOpciones {
  clienteId?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  transportista?: Transportista;
  ventanaHoraria?: string;
  notaInterna?: string;
  metodoPago?: MetodoPago;
  costoEnvio?: number;
  creadoPorAdmin?: boolean;
  idempotencyKey?: string;
}

export interface ClienteAdmin {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  totalPedidos: number;
  ultimoPedidoCodigo?: string;
  ultimoPedidoFecha?: string;
  direccionHabitual?: string;
  comunaHabitual?: string;
}

export interface VarianteProductoAdmin {
  sku: string;
  talla: string;
  stock: number;
  stockInicial: number;
}

export interface ProductoCatalogoAdmin {
  id: string;
  nombre: string;
  categoria: string;
  color: string;
  precio: number;
  tono: TonoProducto;
  variantes: VarianteProductoAdmin[];
}

export interface SkuInventarioPlano {
  productoId: string;
  nombre: string;
  categoria: string;
  tono: TonoProducto;
  precio: number;
  sku: string;
  talla: string;
  stock: number;
  stockInicial: number;
}

export interface AnaliticaOperacion {
  total: number;
  activos: number;
  entregados: number;
  porEstado: Record<EstadoPedido, number>;
  ventasNetas: number;
  ticketPromedio: number;
  porComuna: { comuna: string; cantidad: number; porcentaje: number }[];
  mixCategorias: { categoria: string; unidades: number; porcentaje: number }[];
  stockTotalUnidades: number;
  skusActivosCount: number;
  skusCriticos: SkuInventarioPlano[];
  inventarioPlano: SkuInventarioPlano[];
}

export type EstadoUI<T> =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "vacio" }
  | { tipo: "datos"; datos: T };
