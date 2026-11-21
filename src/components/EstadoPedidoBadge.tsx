// ─── Badge de estado ─────────────────────────────────────────────
//
// Cada estado tiene color, icono y texto. El color nunca viaja solo:
// el icono y la etiqueta hacen que el estado se lea también en escala
// de grises o con daltonismo.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";
import {
  ETIQUETAS_ESTADO,
  EstadoPedido,
  ICONOS_ESTADO,
} from "../types/pedido";

interface Props {
  estado: EstadoPedido;
  compacto?: boolean;
}

export function EstadoPedidoBadge({ estado, compacto = false }: Props) {
  const { colores, tipografia } = useTema();
  const color = colores.estado[estado];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colores.estadoSuave[estado],
          borderColor: color,
          borderRadius: RADIOS.pill,
        },
        compacto && styles.badgeCompacto,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Estado del pedido: ${ETIQUETAS_ESTADO[estado]}`}
    >
      <Icon
        name={ICONOS_ESTADO[estado]}
        size={compacto ? 12 : 14}
        color={color}
      />
      <Text style={[tipografia.micro, styles.texto, { color }]} numberOfLines={1}>
        {ETIQUETAS_ESTADO[estado]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: ESPACIOS.xs + 2,
    borderWidth: 1,
    gap: ESPACIOS.xs + 2,
  },
  badgeCompacto: {
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
  },
  texto: {
    letterSpacing: 0.2,
  },
});
