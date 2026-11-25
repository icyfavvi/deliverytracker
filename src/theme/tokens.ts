// ─── Tokens del sistema de diseño "Atelier Noir" ─────────────────
//
// Traducción del sistema visual Atelier Noir (ink + azul cobalto) a
// React Native / Expo con soporte completo para modo claro y oscuro,
// contraste WCAG AA (>= 4.5:1 en texto normal) y áreas táctiles >= 44pt.

export type ModoTema = "claro" | "oscuro";

// ─── Espaciado (escala de 4pt) ───────────────────────────────────
export const ESPACIOS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  enorme: 40,
} as const;

// ─── Radios (referencia portal: 24 / 16 / 10) ────────────────────
export const RADIOS = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 24,
  pill: 999,
} as const;

// ─── Área táctil mínima (Apple HIG 44pt / Material 48dp) ────────
export const PUNTO_MINIMO = 44;

// ─── Escala de z-index ───────────────────────────────────────────
export const Z_INDEX = {
  base: 0,
  elevado: 10,
  fijo: 20,
  superpuesto: 30,
  modal: 40,
  aviso: 50,
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────
export const BREAKPOINTS = {
  tablet: 840,
  desktop: 1100,
} as const;

// ─── Familias tipográficas ───────────────────────────────────────
// Space Grotesk para titulares y métricas; Manrope para cuerpo y UI;
// DM Mono para etiquetas técnicas, precios y códigos de orden.
export const FUENTES = {
  display: "SpaceGrotesk_500Medium",
  displayFuerte: "SpaceGrotesk_600SemiBold",
  regular: "Manrope_400Regular",
  medio: "Manrope_500Medium",
  semi: "Manrope_600SemiBold",
  fuerte: "SpaceGrotesk_700Bold",
  mono: "DMMono_400Regular",
  monoBold: "DMMono_500Medium",
} as const;

// ─── Escala tipográfica (mínimo 12px para cumplimiento WCAG AA) ──
export const TIPOGRAFIA = {
  display: {
    fontFamily: FUENTES.displayFuerte,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1.1,
  },
  titulo: {
    fontFamily: FUENTES.displayFuerte,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.8,
  },
  subtitulo: {
    fontFamily: FUENTES.displayFuerte,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  eyebrow: {
    fontFamily: FUENTES.monoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.9,
  },
  eyebrowMono: {
    fontFamily: FUENTES.monoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.9,
  },
  tituloDashboard: {
    fontFamily: FUENTES.displayFuerte,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.8,
  },
  metrica: {
    fontFamily: FUENTES.fuerte,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.9,
  },
  cuerpo: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  cuerpoFuerte: {
    fontFamily: FUENTES.semi,
    fontSize: 14,
    lineHeight: 21,
  },
  etiqueta: {
    fontFamily: FUENTES.semi,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  micro: {
    fontFamily: FUENTES.monoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  boton: {
    fontFamily: FUENTES.semi,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  codigo: {
    fontFamily: FUENTES.monoBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 2.2,
  },
} as const;

// ─── Paletas ─────────────────────────────────────────────────────

export interface ColoresTema {
  /** Fondo general de la app (--soft / --ink). */
  fondo: string;
  /** Superficie elevada: tarjetas, hojas (--surface / --ink-2). */
  superficie: string;
  /** Superficie hundida: campos, paneles internos. */
  superficieHundida: string;
  /** Superficie oscura para bloques hero y marca (--ink / --ink-2). */
  panelOscuro: string;
  /** Superficie secundaria dentro de bloques oscuros (--ink-3). */
  panelOscuroBorde: string;
  /** Borde sutil (--line). */
  borde: string;
  /** Borde con más presencia (inputs, separadores fuertes). */
  bordeFuerte: string;
  /** Texto principal (--ink). */
  tinta: string;
  /** Texto secundario (--slate). */
  tintaSecundaria: string;
  /** Texto terciario / metadatos (ajustado a WCAG AA >= 4.5:1). */
  tintaTerciaria: string;
  /** Acento de marca azul cobalto (--blue / --blue-2). */
  acento: string;
  /** Acento suave (--soft-blue). */
  acentoSuave: string;
  /** Acento intenso AA-seguro para texto sobre fondo claro (--blue-dark). */
  acentoIntenso: string;
  /** Botón primario (azul cobalto intenso con texto blanco AA). */
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
  /** Sombra base. */
  sombra: string;
  /** Colores de texto/icono AA-seguros por estado de despacho. */
  estado: {
    recibido: string;
    preparando: string;
    listo: string;
    entregado: string;
  };
  /** Punto/indicador visual vivo por estado (fiel al portal: success, warning, blue, slate). */
  puntoEstado: {
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
    fondo: "#f4f6f8",
    superficie: "#ffffff",
    superficieHundida: "#edf0f5",
    panelOscuro: "#0a0d10",
    panelOscuroBorde: "#171c23",
    borde: "#e7eaee",
    bordeFuerte: "#cfd6df",
    tinta: "#0a0d10",
    tintaSecundaria: "#485563",
    // #7b8794 falla AA (3.5:1) sobre #fff/#f4f6f8; #5b6673 alcanza ~5.1:1
    tintaTerciaria: "#5b6673",
    acento: "#3e6ff6",
    acentoSuave: "#eef4ff",
    acentoIntenso: "#244dcc",
    primario: "#244dcc",
    sobrePrimario: "#ffffff",
    exito: "#1a7a4e",
    exitoSuave: "#e9f8f0",
    advertencia: "#945606",
    advertenciaSuave: "#fef4e6",
    error: "#b8323c",
    errorSuave: "#fdecef",
    info: "#244dcc",
    infoSuave: "#eef4ff",
    overlay: "rgba(10, 13, 16, 0.48)",
    sombra: "#111c2f",
    estado: {
      recibido: "#485563",
      preparando: "#945606",
      listo: "#244dcc",
      entregado: "#1a7a4e",
    },
    puntoEstado: {
      recibido: "#7b8794",
      preparando: "#f0a33a",
      listo: "#3e6ff6",
      entregado: "#2db879",
    },
    estadoSuave: {
      recibido: "#f4f6f8",
      preparando: "#fef4e6",
      listo: "#eef4ff",
      entregado: "#e9f8f0",
    },
  },
  oscuro: {
    fondo: "#0a0d10",
    superficie: "#101419",
    superficieHundida: "#171c23",
    panelOscuro: "#101419",
    panelOscuroBorde: "#252e3a",
    borde: "#222933",
    bordeFuerte: "#343e4d",
    tinta: "#f4f6f8",
    tintaSecundaria: "#bcc5d1",
    tintaTerciaria: "#8e9aa8",
    acento: "#6f95ff",
    acentoSuave: "#162340",
    acentoIntenso: "#9ab5ff",
    // #2d5be3 sobre texto blanco ofrece >5.0:1 de contraste manteniendo el cobalto vivo
    primario: "#2d5be3",
    sobrePrimario: "#ffffff",
    exito: "#4cd496",
    exitoSuave: "#132920",
    advertencia: "#f5b85c",
    advertenciaSuave: "#2b2112",
    error: "#f08087",
    errorSuave: "#2e181b",
    info: "#6f95ff",
    infoSuave: "#162340",
    overlay: "rgba(0, 0, 0, 0.68)",
    sombra: "#000000",
    estado: {
      recibido: "#bcc5d1",
      preparando: "#f5b85c",
      listo: "#86a6ff",
      entregado: "#4cd496",
    },
    puntoEstado: {
      recibido: "#8e9aa8",
      preparando: "#f0a33a",
      listo: "#6f95ff",
      entregado: "#2db879",
    },
    estadoSuave: {
      recibido: "#1a2029",
      preparando: "#2b2112",
      listo: "#162340",
      entregado: "#132920",
    },
  },
};

// ─── Sombras (iOS shadow* + Android elevation) ────────────────────
export function sombraTarjeta(modo: ModoTema) {
  if (modo === "oscuro") {
    return {
      shadowColor: "#000000",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 0,
    };
  }
  return {
    shadowColor: PALETAS.claro.sombra,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  };
}

export function sombraFlotante(modo: ModoTema) {
  if (modo === "oscuro") {
    return {
      shadowColor: "#000000",
      shadowOpacity: 0.55,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    };
  }
  return {
    shadowColor: PALETAS.claro.sombra,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  };
}

// ─── Transiciones ────────────────────────────────────────────────
export const TRANSICIONES = {
  rapida: 160,
  media: 220,
  lenta: 300,
} as const;
