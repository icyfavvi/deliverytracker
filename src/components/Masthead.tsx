// ─── Cabecera editorial (masthead) ──────────────────────────────
//
// El "titular" de cada pantalla: kicker en versalitas, titular en serif,
// bajada en sans. Es el ancla visual que le da a la app aire de revista
// y no de panel de control genérico.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS } from "../theme/tokens";

interface Props {
  /** Kicker: contexto corto en versalitas (ej. "SEGUIMIENTO DE COMPRA"). */
  eyebrow: string;
  /** Titular de la pantalla. */
  titulo: string;
  /** Bajada opcional. */
  descripcion?: string;
  /** Acción a la derecha (por ejemplo, el interruptor de tema). */
  acciones?: React.ReactNode;
  /** Alineación del bloque. */
  centrado?: boolean;
  /** Variante visual: editorial (Playfair Display) o técnico (Inter 700 + JetBrains Mono). */
  variante?: "editorial" | "tecnico";
}

export function Masthead({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  centrado = false,
  variante = "editorial",
}: Props) {
  const { colores, tipografia } = useTema();
  const esTecnico = variante === "tecnico";

  return (
    <View style={[styles.contenedor, centrado && styles.centrado]}>
      <View style={styles.filaTexto}>
        <Text
          style={[
            esTecnico ? tipografia.eyebrowMono : tipografia.eyebrow,
            styles.eyebrow,
            { color: colores.acento },
          ]}
        >
          {eyebrow.toUpperCase()}
        </Text>

        <Text
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
  eyebrow: {
    marginBottom: ESPACIOS.xs + 2,
    textAlign: "left",
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
