// ─── Catálogo y Maestro Base (Atelier Noir) ─────────────────────

import {
  ClienteAdmin,
  ProductoCatalogoAdmin,
  Transportista,
} from "../types/pedido";

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

export const CATALOGO_BASE: ProductoCatalogoAdmin[] = [
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
    variantes: [
      { sku: "AN-CAP-U", talla: "Única", stock: 3, stockInicial: 12 },
    ],
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

export const CLIENTES_BASE: ClienteAdmin[] = [
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
