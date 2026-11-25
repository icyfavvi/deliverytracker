// ─── Píldora de estado de pedido ─────────────────────────────────
//
// Referencia visual Atelier Noir: píldora con borde sutil 1px, fondo
// suave tintado, indicador de punto vivo e icono + etiqueta en DM Mono.
// El color nunca viaja solo: icono y etiqueta aseguran lectura AA.

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
  const colorTexto = colores.estado[estado];
  const colorPunto = colores.puntoEstado[estado];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colores.estadoSuave[estado],
          borderColor: colores.borde,
          borderRadius: RADIOS.pill,
        },
        compacto && styles.badgeCompacto,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Estado del pedido: ${ETIQUETAS_ESTADO[estado]}`}
    >
      <View style={[styles.punto, { backgroundColor: colorPunto }]} />
      <Icon
        name={ICONOS_ESTADO[estado]}
        size={compacto ? 13 : 14}
        color={colorTexto}
      />
      <Text
        style={[tipografia.micro, styles.texto, { color: colorTexto }]}
        numberOfLines={1}
      >
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
    paddingVertical: ESPACIOS.xs + 3,
    borderWidth: 1,
    gap: ESPACIOS.xs + 2,
  },
  badgeCompacto: {
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs + 1,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  texto: {
    letterSpacing: 0.3,
  },
});
