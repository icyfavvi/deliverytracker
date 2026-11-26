// ─── Cabecera y Barra Móvil de CrearPedidoScreen ─────────────────

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Boton } from "../Boton";
import { BotonSalir } from "../BotonSalir";
import { Icon } from "../Icon";
import { InterruptorTema } from "../InterruptorTema";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraFlotante } from "../../theme/tokens";
import { formatearCLP } from "../../utils/formato";

export function CabeceraCrearPedido() {
  const { colores, tipografia, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.headerBar,
        {
          backgroundColor: colores.superficie,
          borderBottomColor: colores.borde,
        },
      ]}
    >
      <View style={styles.headerIzq}>
        <Pressable
          onPress={() => router.replace("/")}
          accessibilityRole="button"
          accessibilityLabel="Volver a Pedidos"
          style={({ pressed }) => [
            styles.botonAtras,
            {
              minHeight: puntoMinimo,
              minWidth: puntoMinimo,
              backgroundColor: colores.superficieHundida,
              borderColor: colores.borde,
              borderRadius: RADIOS.sm,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Icon name="arrow-left" size={17} color={colores.tinta} />
          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
            Pedidos
          </Text>
        </Pressable>

        <View style={styles.headerTitulos}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
          >
            ADMIN · NUEVO PEDIDO
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.subtitulo, { color: colores.tinta }]}
          >
            Crear pedido
          </Text>
        </View>
      </View>

      <View style={styles.headerDer}>
        <BotonSalir />
        <InterruptorTema />
      </View>
    </View>
  );
}

export function BarraInferiorCrearPedido({
  bottomInset,
  cantidadItems,
  total,
  enviando,
  onConfirmar,
}: {
  bottomInset: number;
  cantidadItems: number;
  total: number;
  enviando: boolean;
  onConfirmar: () => void;
}) {
  const { colores, tipografia, modo } = useTema();

  return (
    <View
      style={[
        styles.barraInferiorMovil,
        {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          paddingBottom: Math.max(ESPACIOS.md, bottomInset),
        },
        sombraFlotante(modo),
      ]}
    >
      <View style={styles.barraTotalInfo}>
        <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
          Total CLP ({cantidadItems} ítems)
        </Text>
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          {formatearCLP(total)}
        </Text>
      </View>
      <Boton
        etiqueta={enviando ? "Confirmando…" : "Confirmar pedido"}
        icono="check"
        cargando={enviando}
        deshabilitado={enviando}
        onPress={onConfirmar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ESPACIOS.lg,
    paddingVertical: ESPACIOS.sm + 2,
    borderBottomWidth: 1,
    gap: ESPACIOS.sm,
  },
  headerIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.md,
    flex: 1,
  },
  headerTitulos: { flex: 1, minWidth: 0 },
  headerDer: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.sm },
  botonAtras: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  barraInferiorMovil: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.md,
  },
  barraTotalInfo: { flex: 1, minWidth: 0 },
});
