// ─── Panel de Marca oscuro (Login Atelier Noir) ─────────────────

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "../Icon";
import { InterruptorTema } from "../InterruptorTema";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";

interface Props {
  esAncho: boolean;
}

export function PanelMarca({ esAncho }: Props) {
  const { tipografia, modo } = useTema();

  return (
    <View
      style={[
        styles.panelMarca,
        esAncho && styles.panelMarcaAncho,
        {
          backgroundColor: "#0a0d10",
          borderColor: "#1a2029",
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View pointerEvents="none" style={styles.aroMarca} />
      <View pointerEvents="none" style={styles.brilloAzul} />

      <View style={styles.marcaTop}>
        <View style={styles.brandLockup}>
          <View style={styles.brandIcono}>
            <Icon name="hexagon" size={18} color="#0a0d10" />
          </View>
          <View>
            <Text style={[tipografia.etiqueta, styles.brandNombre]}>
              ATELIER NOIR
            </Text>
            <Text style={[tipografia.caption, styles.brandSub]}>
              STREETWEAR / CHILE
            </Text>
          </View>
        </View>
        {!esAncho ? <InterruptorTema /> : null}
      </View>

      <View style={styles.marcaCentro}>
        <Text style={[tipografia.eyebrowMono, styles.portalTag]}>
          PORTAL PRIVADO / 01
        </Text>
        <Text style={styles.titularHero}>
          Viste lo que{"\n"}
          <Text style={styles.titularAzul}>te mueve.</Text>
        </Text>
        <Text style={[tipografia.cuerpo, styles.marcaBajada]}>
          Gestiona tus pedidos, descubre nuevas cápsulas y mantén cada despacho
          bajo control. Un espacio creado para moverse distinto.
        </Text>
      </View>

      <View style={styles.marcaFooter}>
        <Text style={[tipografia.micro, { color: "#9aa6b4" }]}>
          AN / 2026 — SCL
        </Text>
        <Text style={[tipografia.caption, { color: "#9aa6b4" }]}>
          Moda urbana con origen local
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelMarca: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: ESPACIOS.xl,
    overflow: "hidden",
    position: "relative",
  },
  panelMarcaAncho: {
    flex: 1,
    minHeight: 580,
    padding: ESPACIOS.xxl,
  },
  aroMarca: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "rgba(62, 111, 246, 0.24)",
  },
  brilloAzul: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(62, 111, 246, 0.12)",
  },
  marcaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm + 2,
  },
  brandIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  brandNombre: {
    color: "#ffffff",
    letterSpacing: 1.4,
  },
  brandSub: {
    color: "#9aa6b4",
    letterSpacing: 0.6,
  },
  marcaCentro: {
    gap: ESPACIOS.md,
  },
  portalTag: {
    color: "#9aa6b4",
    letterSpacing: 1.2,
  },
  titularHero: {
    color: "#ffffff",
    fontFamily: FUENTES.fuerte,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.4,
  },
  titularAzul: {
    color: "#6f95ff",
  },
  marcaBajada: {
    color: "#c4cdd8",
    maxWidth: 380,
  },
  marcaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
    paddingTop: ESPACIOS.md,
    borderTopWidth: 1,
    borderTopColor: "#1d242f",
  },
});
