// ─── Motor de Operaciones, Stock O(1) y Analítica en 1 Pasada ──────
//
// Provee catálogo streetwear con índice O(1) por SKU, directorio CRM de
// clientes, descuento atómico de stock, reposición en bodega y agregación
// analítica O(P + V) para las vistas del portal Admin y Cliente.

import {
  AnaliticaOperacion,
  ClienteAdmin,
  EstadoPedido,
  ItemPedido,
  Pedido,
  ProductoCatalogoAdmin,
  SkuInventarioPlano,
  Transportista,
} from "../types/pedido";

export const ENVIO_GRATIS_DESDE_CLP = 80_000;
export const COSTO_ENVIO_CLP = 4_990;
export const TASA_IVA = 0.19;
export const STOCK_CRITICO_MAX = 4;
export const UMBRAL_CONFIRMACION_DEFAULT = 150_000;

export const COMUNAS_RM = [
  "Providencia",
  "Las Condes",
  "Santiago Centro",
  "Ñuñoa",
  "Vitacura",
  "Maipú",
  "La Florida",
  "Puente Alto",
] as const;

export const TRANSPORTISTAS: {
  id: Transportista;
  etiqueta: string;
  detalle: string;
}[] = [
    { id: "Bluex", etiqueta: "Bluex", detalle: "Express RM 24h" },
    { id: "Starken", etiqueta: "Starken", detalle: "Domicilio estándar" },
    { id: "Chilexpress", etiqueta: "Chilexpress", detalle: "Prioritario" },
  ];

export const VENTANAS_HORARIAS = [
  "09:00 – 13:00 (AM)",
  "14:00 – 18:00 (PM)",
  "18:00 – 21:00 (Express)",
] as const;

const CATALOGO_BASE: ProductoCatalogoAdmin[] = [
  {
    id: "prod-hoodie",
    nombre: "Noir Core Hoodie",
    categoria: "Essentials",
    color: "Negro Lavado",
    precio: 54_990,
    tono: "dark",
    variantes: [
      { sku: "AN-HDY-S", talla: "S", stock: 7, stockInicial: 10 },
      { sku: "AN-HDY-M", talla: "M", stock: 4, stockInicial: 10 },
      { sku: "AN-HDY-L", talla: "L", stock: 8, stockInicial: 10 },
      { sku: "AN-HDY-XL", talla: "XL", stock: 2, stockInicial: 8 },
    ],
  },
  {
    id: "prod-utility",
    nombre: "Axis Utility Jacket",
    categoria: "Outerwear",
    color: "Hielo / Grafito",
    precio: 89_990,
    tono: "ice",
    variantes: [
      { sku: "AN-JKT-S", talla: "S", stock: 5, stockInicial: 8 },
      { sku: "AN-JKT-M", talla: "M", stock: 6, stockInicial: 8 },
      { sku: "AN-JKT-L", talla: "L", stock: 1, stockInicial: 8 },
      { sku: "AN-JKT-XL", talla: "XL", stock: 0, stockInicial: 6 },
    ],
  },
  {
    id: "prod-tee",
    nombre: "Signal Tee Cobalto",
    categoria: "Graphic",
    color: "Azul Cobalto",
    precio: 29_990,
    tono: "cobalt",
    variantes: [
      { sku: "AN-TSH-S", talla: "S", stock: 12, stockInicial: 15 },
      { sku: "AN-TSH-M", talla: "M", stock: 4, stockInicial: 15 },
      { sku: "AN-TSH-L", talla: "L", stock: 10, stockInicial: 15 },
      { sku: "AN-TSH-XL", talla: "XL", stock: 0, stockInicial: 10 },
    ],
  },
  {
    id: "prod-cargo",
    nombre: "Cargo 02 — Ash",
    categoria: "Bottoms",
    color: "Gris Ceniza",
    precio: 64_990,
    tono: "steel",
    variantes: [
      { sku: "AN-CRG-30", talla: "30", stock: 6, stockInicial: 10 },
      { sku: "AN-CRG-32", talla: "32", stock: 2, stockInicial: 10 },
      { sku: "AN-CRG-34", talla: "34", stock: 9, stockInicial: 10 },
    ],
  },
  {
    id: "prod-cap",
    nombre: "Studio Cap — Ink",
    categoria: "Accesorios",
    color: "Negro Tinta",
    precio: 22_990,
    tono: "dark",
    variantes: [{ sku: "AN-CAP-U", talla: "Única", stock: 3, stockInicial: 12 }],
  },
  {
    id: "prod-bomber",
    nombre: "Bomber Nylon Tech",
    categoria: "Outerwear",
    color: "Obsidiana",
    precio: 79_990,
    tono: "cobalt",
    variantes: [
      { sku: "AN-BMB-M", talla: "M", stock: 2, stockInicial: 6 },
      { sku: "AN-BMB-L", talla: "L", stock: 5, stockInicial: 6 },
    ],
  },
];

const CLIENTES_BASE: ClienteAdmin[] = [
  {
    id: "cli-01",
    nombre: "Martina Soto",
    correo: "martina.soto@correo.cl",
    telefono: "+56 9 8421 3094",
    totalPedidos: 4,
    ultimoPedidoCodigo: "M4T8",
    ultimoPedidoFecha: "Hace 6 días",
    direccionHabitual: "Av. Providencia 1450, Dpto 802",
    comunaHabitual: "Providencia",
  },
  {
    id: "cli-02",
    nombre: "Diego Araya",
    correo: "d.araya@streetwear.cl",
    telefono: "+56 9 7119 4520",
    totalPedidos: 5,
    ultimoPedidoCodigo: "R9K2",
    ultimoPedidoFecha: "Hace 2 días",
    direccionHabitual: "Av. Apoquindo 4700, Dpto 1204",
    comunaHabitual: "Las Condes",
  },
  {
    id: "cli-03",
    nombre: "Camila Ríos",
    correo: "camila.rios@gmail.com",
    telefono: "+56 9 6340 8812",
    totalPedidos: 2,
    ultimoPedidoCodigo: "P2D7",
    ultimoPedidoFecha: "Hace 10 días",
    direccionHabitual: "Irarrázaval 2820, Casa B",
    comunaHabitual: "Ñuñoa",
  },
  {
    id: "cli-04",
    nombre: "Tomás Vidal",
    correo: "tomas.vidal@mail.cl",
    telefono: "+56 9 9502 1743",
    totalPedidos: 3,
    ultimoPedidoCodigo: "B7N4",
    ultimoPedidoFecha: "Hace 12 días",
    direccionHabitual: "Alonso de Córdova 5870",
    comunaHabitual: "Vitacura",
  },
  {
    id: "cli-05",
    nombre: "Francisca Lagos",
    correo: "fran.lagos@icloud.com",
    telefono: "+56 9 5287 6631",
    totalPedidos: 0,
    direccionHabitual: "Paseo Estado 340, Dpto 410",
    comunaHabitual: "Santiago Centro",
  },
];

let catalogoStock: ProductoCatalogoAdmin[] = JSON.parse(
  JSON.stringify(CATALOGO_BASE)
);
let clientesDirectorio: ClienteAdmin[] = JSON.parse(
  JSON.stringify(CLIENTES_BASE)
);

// Índice hash O(1) para acceso instantáneo a variante y categoría por SKU
let skuIndice: Record<
  string,
  { prodIdx: number; varIdx: number; categoria: string }
> = {};

function reconstruirIndiceSku() {
  const nuevo: typeof skuIndice = {};
  catalogoStock.forEach((prod, prodIdx) => {
    prod.variantes.forEach((v, varIdx) => {
      nuevo[v.sku] = { prodIdx, varIdx, categoria: prod.categoria };
    });
  });
  skuIndice = nuevo;
}

reconstruirIndiceSku();

type StockListener = () => void;
const stockListeners = new Set<StockListener>();

function emitirCambioStock() {
  stockListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignorar listener desconectado
    }
  });
}

export function suscribirStock(listener: StockListener): () => void {
  stockListeners.add(listener);
  return () => {
    stockListeners.delete(listener);
  };
}

export function obtenerCatalogoConStock(): ProductoCatalogoAdmin[] {
  return catalogoStock.map((p) => ({
    ...p,
    variantes: p.variantes.map((v) => ({ ...v })),
  }));
}

export function obtenerStockPorSku(sku: string): number | null {
  const ref = skuIndice[sku];
  if (!ref) return null;
  return catalogoStock[ref.prodIdx]?.variantes[ref.varIdx]?.stock ?? null;
}

/** Verifica y descuenta stock atómicamente en O(k) gracias al índice SKU. */
export function validarYDescontarStockAtomico(items: ItemPedido[]): {
  ok: boolean;
  conflictos: {
    sku: string;
    nombre: string;
    talla?: string;
    solicitado: number;
    disponible: number;
  }[];
} {
  const conflictos: {
    sku: string;
    nombre: string;
    talla?: string;
    solicitado: number;
    disponible: number;
  }[] = [];

  for (const item of items) {
    if (!item.sku) continue;
    const disponible = obtenerStockPorSku(item.sku);
    if (disponible === null) continue;
    if (item.cantidad > disponible) {
      conflictos.push({
        sku: item.sku,
        nombre: item.nombre,
        talla: item.talla,
        solicitado: item.cantidad,
        disponible,
      });
    }
  }

  if (conflictos.length > 0) {
    return { ok: false, conflictos };
  }

  for (const item of items) {
    if (!item.sku) continue;
    const ref = skuIndice[item.sku];
    if (!ref) continue;
    const variante = catalogoStock[ref.prodIdx].variantes[ref.varIdx];
    variante.stock = Math.max(0, variante.stock - item.cantidad);
  }
  emitirCambioStock();
  return { ok: true, conflictos: [] };
}

export function reponerStockSku(sku: string, cantidad: number): number | null {
  const ref = skuIndice[sku];
  if (!ref) return null;
  const variante = catalogoStock[ref.prodIdx].variantes[ref.varIdx];
  variante.stock = Math.max(0, variante.stock + cantidad);
  if (variante.stock > variante.stockInicial) {
    variante.stockInicial = variante.stock;
  }
  emitirCambioStock();
  return variante.stock;
}

export function simularBajaExternaStock(sku: string): number | null {
  const ref = skuIndice[sku];
  if (!ref) return null;
  const variante = catalogoStock[ref.prodIdx].variantes[ref.varIdx];
  variante.stock = Math.max(0, variante.stock - 1);
  emitirCambioStock();
  return variante.stock;
}

export function buscarClientes(termino: string): ClienteAdmin[] {
  const q = termino.trim().toLowerCase();
  if (!q) return [...clientesDirectorio];
  const soloDigitos = q.replace(/\D/g, "");
  return clientesDirectorio.filter((c) => {
    const telDigitos = c.telefono.replace(/\D/g, "");
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.correo.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q) ||
      (soloDigitos.length >= 3 && telDigitos.includes(soloDigitos))
    );
  });
}

export function crearClienteDirectorio(datos: {
  nombre: string;
  correo: string;
  telefono: string;
}): ClienteAdmin {
  const nuevo: ClienteAdmin = {
    id: `cli-${Date.now().toString(36)}`,
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim().toLowerCase(),
    telefono: datos.telefono.trim(),
    totalPedidos: 0,
  };
  clientesDirectorio = [nuevo, ...clientesDirectorio];
  return nuevo;
}

export function registrarPedidoEnCliente(
  clienteId: string | undefined,
  codigo: string
) {
  if (!clienteId) return;
  clientesDirectorio = clientesDirectorio.map((c) =>
    c.id === clienteId
      ? {
        ...c,
        totalPedidos: c.totalPedidos + 1,
        ultimoPedidoCodigo: codigo,
        ultimoPedidoFecha: "Recién creado",
      }
      : c
  );
}

export function calcularTotalesChile(subtotalConIva: number) {
  const subtotal = Math.max(0, Math.round(subtotalConIva));
  const ivaIncluido =
    subtotal > 0 ? Math.round(subtotal - subtotal / (1 + TASA_IVA)) : 0;
  const envio =
    subtotal === 0 || subtotal >= ENVIO_GRATIS_DESDE_CLP ? 0 : COSTO_ENVIO_CLP;
  const total = subtotal + envio;
  return { subtotal, ivaIncluido, envio, total };
}

/**
 * Agregación analítica O(P + V) en una sola pasada:
 * evita múltiples `.filter()` / `.reduce()` independientes en cada render.
 */
export function calcularAnaliticaOperacion(
  pedidos: Pedido[],
  catalogo: ProductoCatalogoAdmin[]
): AnaliticaOperacion {
  const porEstado: Record<EstadoPedido, number> = {
    recibido: 0,
    preparando: 0,
    listo: 0,
    entregado: 0,
  };
  const mapaComunas = new Map<string, number>();
  const mapaCategorias = new Map<string, number>();

  let ventasNetas = 0;
  let totalUnidadesVendidas = 0;

  for (const p of pedidos) {
    porEstado[p.estado] += 1;
    ventasNetas += p.totalEstimado ?? 0;

    const com = (p.comuna || "Santiago").trim();
    mapaComunas.set(com, (mapaComunas.get(com) ?? 0) + 1);

    for (const item of p.items) {
      totalUnidadesVendidas += item.cantidad;
      const cat =
        (item.sku ? skuIndice[item.sku]?.categoria : undefined) ??
        "Streetwear";
      mapaCategorias.set(cat, (mapaCategorias.get(cat) ?? 0) + item.cantidad);
    }
  }

  const total = pedidos.length;
  const entregados = porEstado.entregado;
  const activos = total - entregados;
  const ticketPromedio = total > 0 ? Math.round(ventasNetas / total) : 0;

  const porComuna = Array.from(mapaComunas.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([comuna, cantidad]) => ({
      comuna,
      cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
    }));

  // Si aún no hay órdenes, derivar el mix estructural desde el catálogo en O(V)
  if (totalUnidadesVendidas === 0) {
    for (const prod of catalogo) {
      let stockProd = 0;
      for (const v of prod.variantes) stockProd += v.stock;
      mapaCategorias.set(
        prod.categoria,
        (mapaCategorias.get(prod.categoria) ?? 0) + stockProd
      );
      totalUnidadesVendidas += stockProd;
    }
  }

  const mixCategorias = Array.from(mapaCategorias.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, unidades]) => ({
      categoria,
      unidades,
      porcentaje:
        totalUnidadesVendidas > 0
          ? Math.round((unidades / totalUnidadesVendidas) * 100)
          : 0,
    }));

  const inventarioPlano: SkuInventarioPlano[] = [];
  const skusCriticos: SkuInventarioPlano[] = [];
  let stockTotalUnidades = 0;

  for (const prod of catalogo) {
    for (const v of prod.variantes) {
      stockTotalUnidades += v.stock;
      const plano: SkuInventarioPlano = {
        productoId: prod.id,
        nombre: prod.nombre,
        categoria: prod.categoria,
        tono: prod.tono,
        precio: prod.precio,
        sku: v.sku,
        talla: v.talla,
        stock: v.stock,
        stockInicial: v.stockInicial,
      };
      inventarioPlano.push(plano);
      if (v.stock <= STOCK_CRITICO_MAX) {
        skusCriticos.push(plano);
      }
    }
  }

  skusCriticos.sort((a, b) => a.stock - b.stock);

  return {
    total,
    activos,
    entregados,
    porEstado,
    ventasNetas,
    ticketPromedio,
    porComuna,
    mixCategorias,
    stockTotalUnidades,
    skusActivosCount: inventarioPlano.length,
    skusCriticos,
    inventarioPlano,
  };
}

