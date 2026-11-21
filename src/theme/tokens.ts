// ─── Tokens del sistema de diseño "Atelier Noir" ─────────────────
//
// Un solo lugar donde vive cada valor. Si un color, un espaciado o un
// radio aparece en un componente y no está aquí, es una fuga: muévelo.
//
// El sistema tiene dos paletas (papel claro / tinta oscura) que comparten
// la misma estructura de claves. Así los componentes nunca pregunten
// "¿qué color va aquí?": preguntan al contexto por `colores.<clave>`.

export type ModoTema = "claro" | "oscuro";

// ─── Espaciado ───────────────────────────────────────────────────
// Escala de 4pt. "xs"=4, "sm"=8, "md"=12, "lg"=16, "xl"=24, "xxl"=32.
export const ESPACIOS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  enorme: 40,
} as const;

// ─── Radios ──────────────────────────────────────────────────────
export const RADIOS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// ─── Área táctil mínima (Apple HIG 44pt / Material 48dp) ────────
export const PUNTO_MINIMO = 44;

// ─── Escala de z-index (sin números mágicos sueltos) ─────────────
export const Z_INDEX = {
  base: 0,
  elevado: 10,
  fijo: 20,
  superpuesto: 30,
  modal: 40,
  aviso: 50,
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────
// "tablet" es el punto donde dos columnas caben sin estrujarse: por
// debajo de 840px el formulario y la lista se apilan en un solo scroll.
export const BREAKPOINTS = {
  tablet: 840,
  desktop: 1100,
} as const;

// ─── Familias tipográficas ───────────────────────────────────────
// Playfair Display para la voz editorial (marca, títulos grandes).
// Inter para todo lo que se lee en flujo: UI, datos, botones.
export const FUENTES = {
  display: "PlayfairDisplay_600SemiBold",
  displayFuerte: "PlayfairDisplay_700Bold",
  regular: "Inter_400Regular",
  medio: "Inter_500Medium",
  semi: "Inter_600SemiBold",
  fuerte: "Inter_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_600SemiBold",
} as const;

// ─── Escala tipográfica ──────────────────────────────────────────
// `letterSpacing` negativo en display (tracking cerrado) y positivo
// en los eyebrow (tracking abierto de revista).
export const TIPOGRAFIA = {
  display: {
    fontFamily: FUENTES.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  titulo: {
    fontFamily: FUENTES.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  subtitulo: {
    fontFamily: FUENTES.displayFuerte,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  eyebrow: {
    fontFamily: FUENTES.semi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.8,
  },
  eyebrowMono: {
    fontFamily: FUENTES.monoBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 2.2,
  },
  tituloDashboard: {
    fontFamily: FUENTES.fuerte,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  cuerpo: {
    fontFamily: FUENTES.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  cuerpoFuerte: {
    fontFamily: FUENTES.medio,
    fontSize: 15,
    lineHeight: 22,
  },
  etiqueta: {
    fontFamily: FUENTES.medio,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  micro: {
    fontFamily: FUENTES.medio,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
  },
  boton: {
    fontFamily: FUENTES.semi,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  codigo: {
    fontFamily: FUENTES.monoBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 3,
  },
} as const;

// ─── Paletas ─────────────────────────────────────────────────────

export interface ColoresTema {
  /** Fondo general de la app (papel). */
  fondo: string;
  /** Superficie elevada: tarjetas, hojas. */
  superficie: string;
  /** Superficie hundida: campos, paneles internos. */
  superficieHundida: string;
  /** Borde sutil. */
  borde: string;
  /** Borde con más presencia (inputs, separadores fuertes). */
  bordeFuerte: string;
  /** Texto principal. */
  tinta: string;
  /** Texto secundario. */
  tintaSecundaria: string;
  /** Texto terciario / metadatos. */
  tintaTerciaria: string;
  /** Acento de marca (latón). */
  acento: string;
  /** Acento suave: fondos de realce, chips. */
  acentoSuave: string;
  /** Acento intenso: texto de acento sobre papel. */
  acentoIntenso: string;
  /** Botón primario en modo oscuro (fondo claro, texto oscuro). */
  primario: string;
  /** Texto sobre `primario`. */
  sobrePrimario: string;
  exito: string;
  exitoSuave: string;
  advertencia: string;
  advertenciaSuave: string;
  error: string;
  errorSuave: string;
  info: string;
  infoSuave: string;
  /** Overlay para modales/sheets. */
  overlay: string;
  /** Sombra base (alpha). */
  sombra: string;
  /** Colores por estado de despacho. */
  estado: {
    recibido: string;
    preparando: string;
    listo: string;
    entregado: string;
  };
  /** Fondo suave por estado de despacho. */
  estadoSuave: {
    recibido: string;
    preparando: string;
    listo: string;
    entregado: string;
  };
}

export const PALETAS: Record<ModoTema, ColoresTema> = {
  claro: {
    fondo: "#F4F1EB",
    superficie: "#FFFFFF",
    superficieHundida: "#ECE7DE",
    borde: "#E1DBD0",
    bordeFuerte: "#C6BDAE",
    tinta: "#15120E",
    tintaSecundaria: "#5C554A",
    tintaTerciaria: "#8B8377",
    acento: "#8C6D3F",
    acentoSuave: "#F1E8D8",
    acentoIntenso: "#6B5228",
    primario: "#15120E",
    sobrePrimario: "#F7F4EE",
    exito: "#38674A",
    exitoSuave: "#E4F0E7",
    advertencia: "#8F6415",
    advertenciaSuave: "#F7EBD8",
    error: "#9E3327",
    errorSuave: "#F8E6E2",
    info: "#2C5673",
    infoSuave: "#E3EDF3",
    overlay: "rgba(21, 18, 14, 0.45)",
    sombra: "#2A211A",
    estado: {
      recibido: "#4A4741",
      preparando: "#8F6415",
      listo: "#2C5673",
      entregado: "#38674A",
    },
    estadoSuave: {
      recibido: "#EDEAE4",
      preparando: "#F7EBD8",
      listo: "#E3EDF3",
      entregado: "#E4F0E7",
    },
  },
  oscuro: {
    fondo: "#100F0D",
    superficie: "#1A1815",
    superficieHundida: "#232019",
    borde: "#302C26",
    bordeFuerte: "#48423A",
    tinta: "#F5F2EB",
    tintaSecundaria: "#B0A89C",
    tintaTerciaria: "#867E72",
    acento: "#D2B07A",
    acentoSuave: "#2B2418",
    acentoIntenso: "#E7CB99",
    primario: "#F5F2EB",
    sobrePrimario: "#15120E",
    exito: "#7CC093",
    exitoSuave: "#1B2A20",
    advertencia: "#D9A44E",
    advertenciaSuave: "#2E2415",
    error: "#E88B7D",
    errorSuave: "#311E1A",
    info: "#7FB2D4",
    infoSuave: "#16262F",
    overlay: "rgba(0, 0, 0, 0.62)",
    sombra: "#000000",
    estado: {
      recibido: "#B9B2A7",
      preparando: "#D9A44E",
      listo: "#7FB2D4",
      entregado: "#7CC093",
    },
    estadoSuave: {
      recibido: "#262320",
      preparando: "#2E2415",
      listo: "#16262F",
      entregado: "#1B2A20",
    },
  },
};

// ─── Sombras ─────────────────────────────────────────────────────
// En modo oscuro la sombra no existe: el borde hace el trabajo.
export function sombraTarjeta(modo: ModoTema) {
  if (modo === "oscuro") {
    return {
      shadowColor: "#000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    };
  }
  return {
    shadowColor: PALETAS.claro.sombra,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
}

export function sombraFlotante(modo: ModoTema) {
  if (modo === "oscuro") {
    return {
      shadowColor: "#000",
      shadowOpacity: 0.5,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    };
  }
  return {
    shadowColor: PALETAS.claro.sombra,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  };
}

// ─── Transiciones ────────────────────────────────────────────────
// 150-300ms, solo transform/opacity. Nunca más.
export const TRANSICIONES = {
  rapida: 160,
  media: 220,
  lenta: 300,
} as const;
