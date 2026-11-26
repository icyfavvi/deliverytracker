// ─── Panel Destino del Pedido (Seguimiento Cliente) ──────────────

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { Pedido } from "../../types/pedido";

export function TarjetaDestinoPedido({
  pedido,
  esAncho,
}: {
  pedido: Pedido;
  esAncho: boolean;
}) {
  const { colores, tipografia, modo } = useTema();

  return (
    <View
      style={[
        styles.panel,
        esAncho && styles.colMenor,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View style={styles.panelHead}>
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Destino
        </Text>
        <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
          Información de entrega
        </Text>
      </View>

      <View
        style={[
          styles.rutaCard,
          {
            backgroundColor: colores.superficieHundida,
            borderColor: colores.borde,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <Icon name="warehouse" size={18} color={colores.tinta} />
        <View style={styles.flex}>
          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
            Bodega Atelier Noir
          </Text>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            Av. Italia 1442, Ñuñoa
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.rutaCard,
          {
            backgroundColor: colores.acentoSuave,
            borderColor: colores.acento,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <Icon name="map-pin" size={18} color={colores.acentoIntenso} />
        <View style={styles.flex}>
          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
            {pedido.comuna}
          </Text>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            {pedido.direccionDespacho}
          </Text>
          <Text
            style={[
              tipografia.caption,
              {
                color: colores.acentoIntenso,
                fontFamily: FUENTES.semi,
                marginTop: 2,
              },
            ]}
          >
            {pedido.clienteNombre} · {pedido.metodoEnvio}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  colMenor: { flex: 0.9, minWidth: 0 },
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHead: { gap: 2 },
  rutaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.md,
    padding: ESPACIOS.md,
    borderWidth: 1,
  },
});
