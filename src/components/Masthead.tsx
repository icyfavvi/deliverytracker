// ─── Cabecera de pantalla (Masthead) ─────────────────────────────
//
// Referencia Atelier Noir: etiqueta superior en DM Mono uppercase,
// titular geométrico en Space Grotesk con tracking negativo y bajada
// legible en Manrope (>= 14px).

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

interface Props {
  /** Contexto corto en mayúsculas (ej. "SEGUIMIENTO DE COMPRA"). */
  eyebrow: string;
  /** Titular principal de la pantalla. */
  titulo: string;
  /** Bajada opcional. */
  descripcion?: string;
  /** Acciones a la derecha (ej. interruptor de tema, botón salir). */
  acciones?: React.ReactNode;
  /** Alineación centrada del bloque. */
  centrado?: boolean;
  /** Variante visual (conservada por compatibilidad de props). */
  variante?: "editorial" | "tecnico";
}

export function Masthead({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  centrado = false,
  variante = "tecnico",
}: Props) {
  const { colores, tipografia } = useTema();
  const esTecnico = variante === "tecnico";

  return (
    <View style={[styles.contenedor, centrado && styles.centrado]}>
      <View style={[styles.filaTexto, centrado && styles.filaCentrada]}>
        <View
          style={[
            styles.kickerPill,
            {
              backgroundColor: colores.acentoSuave,
              borderRadius: RADIOS.pill,
            },
          ]}
        >
          <View style={[styles.kickerPunto, { backgroundColor: colores.acento }]} />
          <Text
            style={[
              esTecnico ? tipografia.eyebrowMono : tipografia.eyebrow,
              { color: colores.acentoIntenso },
            ]}
          >
            {eyebrow.toUpperCase()}
          </Text>
        </View>

        <Text
          accessibilityRole="header"
          style={[
            esTecnico ? tipografia.tituloDashboard : tipografia.display,
            styles.titulo,
            { color: colores.tinta },
            centrado && styles.textoCentrado,
          ]}
        >
          {titulo}
        </Text>

        {descripcion ? (
          <Text
            style={[
              tipografia.cuerpo,
              styles.descripcion,
              { color: colores.tintaSecundaria },
              centrado && styles.textoCentrado,
            ]}
          >
            {descripcion}
          </Text>
        ) : null}
      </View>

      {acciones ? <View style={styles.acciones}>{acciones}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: ESPACIOS.md,
    marginBottom: ESPACIOS.lg,
  },
  centrado: {
    flexDirection: "column",
    alignItems: "center",
  },
  filaTexto: {
    flex: 1,
    alignItems: "flex-start",
  },
  filaCentrada: {
    alignItems: "center",
  },
  kickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
    marginBottom: ESPACIOS.sm,
  },
  kickerPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titulo: {
    marginBottom: ESPACIOS.xs + 2,
    textAlign: "left",
  },
  descripcion: {
    maxWidth: 640,
    textAlign: "left",
  },
  textoCentrado: {
    textAlign: "center",
  },
  acciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
});
