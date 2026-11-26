// ─── Tarjeta de Producto + Tallas/Stepper (SelectorProducto) ─────

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../Icon";
import { STOCK_CRITICO_MAX } from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS } from "../../theme/tokens";
import {
  ItemPedido,
  ProductoCatalogoAdmin,
  VarianteProductoAdmin,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";

interface Props {
  prod: ProductoCatalogoAdmin;
  variante: VarianteProductoAdmin;
  lineasPedido: ItemPedido[];
  onSeleccionarTalla: (productoId: string, talla: string) => void;
  onCambiarCantidadSku: (
    prod: ProductoCatalogoAdmin,
    sku: string,
    talla: string,
    stockDisponible: number,
    delta: number
  ) => void;
}

export function TarjetaProductoSelector({
  prod,
  variante,
  lineasPedido,
  onSeleccionarTalla,
  onCambiarCantidadSku,
}: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();
  const lineaEnCarrito = lineasPedido.find((l) => l.sku === variante.sku);
  const cantidad = lineaEnCarrito?.cantidad ?? 0;
  const esCritico =
    variante.stock > 0 && variante.stock <= STOCK_CRITICO_MAX;
  const agotado = variante.stock === 0;
  const porcentajeStock = Math.min(
    100,
    Math.round((variante.stock / Math.max(1, variante.stockInicial)) * 100)
  );

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: colores.superficieHundida,
          borderColor: colores.borde,
          borderRadius: RADIOS.md,
        },
      ]}
    >
      <View style={styles.productTop}>
        <View style={styles.productTitulos}>
          <Text style={[tipografia.micro, { color: colores.tintaTerciaria }]}>
            {prod.categoria.toUpperCase()} · {variante.sku}
          </Text>
          <Text style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}>
            {prod.nombre}
          </Text>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            {prod.color}
          </Text>
        </View>

        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          {formatearCLP(prod.precio)}
        </Text>
      </View>

      <View style={styles.chipsWrap}>
        {prod.variantes.map((v) => {
          const seleccionada = v.sku === variante.sku;
          const sinStock = v.stock === 0;
          return (
            <Pressable
              key={v.sku}
              onPress={() => onSeleccionarTalla(prod.id, v.talla)}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionada }}
              accessibilityLabel={`Talla ${v.talla}, ${v.stock} disponibles`}
              style={[
                styles.chipTalla,
                {
                  minHeight: puntoMinimo,
                  minWidth: 56,
                  backgroundColor: seleccionada
                    ? colores.acentoSuave
                    : colores.superficie,
                  borderColor: seleccionada ? colores.acento : colores.borde,
                  borderRadius: RADIOS.sm,
                  opacity: sinStock && !seleccionada ? 0.55 : 1,
                },
              ]}
            >
              <Text
                style={[
                  tipografia.caption,
                  {
                    color: seleccionada ? colores.acentoIntenso : colores.tinta,
                    fontFamily: seleccionada ? FUENTES.semi : FUENTES.regular,
                  },
                ]}
              >
                {v.talla} ({v.stock})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.productBottom}>
        <View style={styles.stockColumna}>
          <View style={styles.stockBadges}>
            <Text
              style={[
                tipografia.caption,
                {
                  color: agotado
                    ? colores.error
                    : esCritico
                      ? colores.advertencia
                      : colores.tintaSecundaria,
                  fontFamily: FUENTES.semi,
                },
              ]}
            >
              {agotado ? "Sin stock" : `Stock: ${variante.stock} un.`}
            </Text>

            {esCritico ? (
              <View
                style={[
                  styles.pillCritico,
                  {
                    backgroundColor: colores.advertenciaSuave,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dotCritico,
                    { backgroundColor: colores.puntoEstado.preparando },
                  ]}
                />
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.advertencia, fontFamily: FUENTES.semi },
                  ]}
                >
                  Crítico
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={[styles.stockBarFondo, { backgroundColor: colores.borde }]}
          >
            <View
              style={[
                styles.stockBarRelleno,
                {
                  width: `${porcentajeStock}%`,
                  backgroundColor: agotado
                    ? colores.error
                    : esCritico
                      ? colores.puntoEstado.preparando
                      : colores.puntoEstado.entregado,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.stepper}>
          <Pressable
            onPress={() =>
              onCambiarCantidadSku(
                prod,
                variante.sku,
                variante.talla,
                variante.stock,
                -1
              )
            }
            disabled={cantidad === 0}
            accessibilityRole="button"
            accessibilityLabel={`Restar ${prod.nombre} talla ${variante.talla}`}
            style={({ pressed }) => [
              styles.stepperBoton,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
                opacity: cantidad === 0 ? 0.4 : pressed ? 0.65 : 1,
              },
            ]}
          >
            <Icon name="minus" size={16} color={colores.tinta} />
          </Pressable>

          <Text
            style={[
              tipografia.micro,
              styles.stepperCantidad,
              { color: colores.tinta },
            ]}
          >
            {cantidad}
          </Text>

          <Pressable
            onPress={() =>
              onCambiarCantidadSku(
                prod,
                variante.sku,
                variante.talla,
                variante.stock,
                1
              )
            }
            disabled={agotado || cantidad >= variante.stock}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${prod.nombre} talla ${variante.talla}`}
            style={({ pressed }) => [
              styles.stepperBoton,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor:
                  cantidad >= variante.stock ? colores.borde : colores.acento,
                backgroundColor:
                  agotado || cantidad >= variante.stock
                    ? colores.superficie
                    : colores.acentoSuave,
                opacity:
                  agotado || cantidad >= variante.stock
                    ? 0.45
                    : pressed
                      ? 0.7
                      : 1,
              },
            ]}
          >
            <Icon
              name="plus"
              size={16}
              color={
                agotado || cantidad >= variante.stock
                  ? colores.tintaTerciaria
                  : colores.acentoIntenso
              }
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: { padding: ESPACIOS.md, borderWidth: 1, gap: ESPACIOS.md },
  productTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: ESPACIOS.sm,
  },
  productTitulos: { flex: 1, minWidth: 0, gap: 2 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm },
  chipTalla: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.sm + 2,
    borderWidth: 1,
    cursor: "pointer",
  },
  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  stockColumna: { flex: 1, minWidth: 140, gap: ESPACIOS.xs + 2 },
  stockBadges: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.sm },
  pillCritico: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: ESPACIOS.sm,
    paddingVertical: 2,
  },
  dotCritico: { width: 6, height: 6, borderRadius: 3 },
  stockBarFondo: { height: 6, borderRadius: 3, overflow: "hidden" },
  stockBarRelleno: { height: "100%", borderRadius: 3 },
  stepper: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.xs + 2 },
  stepperBoton: {
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  stepperCantidad: { minWidth: 26, textAlign: "center" },
});
