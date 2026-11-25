// ─── Tarjeta de Producto Atelier Noir (referencia .product-card) ──
//
// Tarjeta visual streetwear con variantes de tono (dark / ice / cobalt / steel),
// aros concéntricos sutiles, stock en vivo y botón "+ Añadir" >= 44pt.

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "./Icon";
import { STOCK_CRITICO_MAX } from "../services/operacionesMock";
import { useTema } from "../theme/ThemeProvider";
import {
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";
import { ProductoCatalogoAdmin, TonoProducto } from "../types/pedido";

interface Props {
  producto: ProductoCatalogoAdmin;
  onAgregar?: (producto: ProductoCatalogoAdmin) => void;
  etiquetaAccion?: string;
}

const PALETA_TONO: Record<
  TonoProducto,
  { fondo: string; prendaBg: string; prendaFg: string; aro: string }
> = {
  dark: {
    fondo: "#101419",
    prendaBg: "rgba(255,255,255,0.14)",
    prendaFg: "#ffffff",
    aro: "rgba(255,255,255,0.09)",
  },
  ice: {
    fondo: "#dce3ec",
    prendaBg: "rgba(10,13,16,0.12)",
    prendaFg: "#0a0d10",
    aro: "rgba(10,13,16,0.08)",
  },
  cobalt: {
    fondo: "#244dcc",
    prendaBg: "rgba(255,255,255,0.18)",
    prendaFg: "#ffffff",
    aro: "rgba(111,149,255,0.32)",
  },
  steel: {
    fondo: "#6e7a88",
    prendaBg: "rgba(255,255,255,0.16)",
    prendaFg: "#ffffff",
    aro: "rgba(255,255,255,0.12)",
  },
};

export function ProductoCatalogoCard({
  producto,
  onAgregar,
  etiquetaAccion = "Añadir",
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const tono = PALETA_TONO[producto.tono];

  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stock, 0);
  const agotado = stockTotal === 0;
  const esCritico = stockTotal > 0 && stockTotal <= STOCK_CRITICO_MAX;

  const formatearPrecio = (val: number) => "$" + val.toLocaleString("es-CL");

  return (
    <View
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
      {/* Arte superior estilo cápsula */}
      <View
        style={[
          styles.imagenBox,
          { backgroundColor: tono.fondo, borderRadius: RADIOS.sm },
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.aro, { borderColor: tono.aro }]}
        />
        <View style={[styles.siluetaPill, { backgroundColor: tono.prendaBg }]}>
          <Icon name="shirt" size={28} color={tono.prendaFg} />
        </View>
      </View>

      {/* Info del producto */}
      <View style={styles.cuerpo}>
        <Text
          style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
          numberOfLines={1}
        >
          {producto.nombre}
        </Text>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          {formatearPrecio(producto.precio)}
        </Text>
      </View>

      {/* Acción + stock en vivo */}
      <View style={styles.pie}>
        {onAgregar ? (
          <Pressable
            onPress={() => onAgregar(producto)}
            disabled={agotado}
            accessibilityRole="button"
            accessibilityLabel={`${etiquetaAccion} ${producto.nombre}`}
            style={({ pressed }) => [
              styles.addBtn,
              {
                minHeight: puntoMinimo,
                backgroundColor: agotado
                  ? colores.superficieHundida
                  : colores.acentoSuave,
                borderRadius: RADIOS.sm,
                opacity: agotado ? 0.5 : pressed ? 0.72 : 1,
              },
            ]}
          >
            <Icon
              name={agotado ? "x" : "plus"}
              size={14}
              color={agotado ? colores.tintaTerciaria : colores.acentoIntenso}
            />
            <Text
              style={[
                tipografia.caption,
                {
                  color: agotado
                    ? colores.tintaTerciaria
                    : colores.acentoIntenso,
                  fontFamily: FUENTES.semi,
                },
              ]}
            >
              {agotado ? "Agotado" : etiquetaAccion}
            </Text>
          </Pressable>
        ) : null}

        <Text
          style={[
            tipografia.caption,
            {
              color: agotado
                ? colores.error
                : esCritico
                  ? colores.advertencia
                  : colores.tintaSecundaria,
              fontFamily: esCritico ? FUENTES.semi : FUENTES.regular,
            },
          ]}
        >
          {agotado
            ? "Sin unidades"
            : esCritico
              ? `Últimas ${stockTotal} un.`
              : `En stock (${stockTotal})`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  imagenBox: {
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  aro: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
  },
  siluetaPill: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cuerpo: {
    gap: 2,
    paddingHorizontal: 2,
  },
  pie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: ESPACIOS.md,
    cursor: "pointer",
  },
});
