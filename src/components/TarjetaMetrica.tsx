// ─── Tarjeta de métrica (referencia .admin-metric) ─────────────────
//
// Muestra un indicador clave de operación con etiqueta en DM Mono,
// cifra en Space Grotesk e icono suave en cobalto o color de estado.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon, LucideIconName } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../theme/tokens";

export type TonoMetrica = "acento" | "exito" | "advertencia" | "neutro";

interface Props {
  etiqueta: string;
  valor: string | number;
  subtitulo?: string;
  icono: LucideIconName;
  tono?: TonoMetrica;
}

export function TarjetaMetrica({
  etiqueta,
  valor,
  subtitulo,
  icono,
  tono = "acento",
}: Props) {
  const { colores, tipografia, modo } = useTema();

  const paletaTono = {
    acento: { fg: colores.acentoIntenso, bg: colores.acentoSuave },
    exito: { fg: colores.exito, bg: colores.exitoSuave },
    advertencia: { fg: colores.advertencia, bg: colores.advertenciaSuave },
    neutro: { fg: colores.tintaSecundaria, bg: colores.superficieHundida },
  }[tono];

  return (
    <View
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}${subtitulo ? `, ${subtitulo}` : ""}`}
      style={[
        styles.card,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.md,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View style={styles.filaTop}>
        <Text
          style={[
            tipografia.eyebrowMono,
            styles.etiqueta,
            { color: colores.tintaTerciaria },
          ]}
          numberOfLines={1}
        >
          {etiqueta.toUpperCase()}
        </Text>
        <View
          style={[
            styles.iconoBadge,
            { backgroundColor: paletaTono.bg, borderRadius: RADIOS.sm },
          ]}
        >
          <Icon name={icono} size={15} color={paletaTono.fg} />
        </View>
      </View>

      <Text
        style={[tipografia.metrica, { color: colores.tinta }]}
        numberOfLines={1}
      >
        {valor}
      </Text>

      {subtitulo ? (
        <Text
          style={[tipografia.caption, styles.subtitulo, { color: colores.tintaSecundaria }]}
          numberOfLines={1}
        >
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 145,
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.xs,
  },
  filaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.xs,
  },
  etiqueta: {
    flex: 1,
  },
  iconoBadge: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitulo: {
    marginTop: 2,
  },
});
