// ─── Bloque 2: Selector de Productos y Variantes SKU (FlatList #13) ─

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { STOCK_CRITICO_MAX } from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  ItemPedido,
  ProductoCatalogoAdmin,
  VarianteProductoAdmin,
} from "../../types/pedido";
import { TarjetaProductoSelector } from "./TarjetaProductoSelector";

interface Props {
  totalCatalogo: number;
  productosFiltrados: ProductoCatalogoAdmin[];
  busquedaProducto: string;
  filtroStockCritico: boolean;
  lineasPedido: ItemPedido[];
  mensajeStockLive: string | null;
  errorProductos?: string;
  varianteActivaDe: (prod: ProductoCatalogoAdmin) => VarianteProductoAdmin;
  onCambiarBusqueda: (txt: string) => void;
  onCambiarFiltroCritico: (valor: boolean) => void;
  onLimpiarFiltros: () => void;
  onSimularBajaStock: () => void;
  onSeleccionarTalla: (productoId: string, talla: string) => void;
  onCambiarCantidadSku: (
    prod: ProductoCatalogoAdmin,
    sku: string,
    talla: string,
    stockDisponible: number,
    delta: number
  ) => void;
}

export function SelectorProducto({
  totalCatalogo,
  productosFiltrados,
  busquedaProducto,
  filtroStockCritico,
  lineasPedido,
  mensajeStockLive,
  errorProductos,
  varianteActivaDe,
  onCambiarBusqueda,
  onCambiarFiltroCritico,
  onLimpiarFiltros,
  onSimularBajaStock,
  onSeleccionarTalla,
  onCambiarCantidadSku,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colores.superficie,
          borderColor: errorProductos ? colores.error : colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View style={styles.panelHeadFila}>
        <View style={styles.panelHead}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
          >
            BLOQUE 2 · PRODUCTOS
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Catálogo y stock en vivo
          </Text>
        </View>

        <Pressable
          onPress={onSimularBajaStock}
          accessibilityRole="button"
          accessibilityLabel="Simular caída externa de stock para pruebas"
          style={({ pressed }) => [
            styles.chipMini,
            {
              minHeight: puntoMinimo,
              backgroundColor: colores.superficieHundida,
              borderColor: colores.borde,
              borderRadius: RADIOS.pill,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Icon name="activity" size={14} color={colores.tintaSecundaria} />
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            Simular baja stock
          </Text>
        </Pressable>
      </View>

      <CampoTexto
        etiqueta="Buscar prenda o SKU"
        valor={busquedaProducto}
        onCambio={onCambiarBusqueda}
        placeholder="Noir, Denim, AN-HDY…"
        icono="search"
        autoCapitalize="none"
      />

      <View style={styles.chipsWrap}>
        <Pressable
          onPress={() => onCambiarFiltroCritico(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: !filtroStockCritico }}
          style={[
            styles.chipOpcion,
            {
              minHeight: puntoMinimo,
              backgroundColor: !filtroStockCritico
                ? colores.acentoSuave
                : colores.superficieHundida,
              borderColor: !filtroStockCritico ? colores.acento : colores.borde,
              borderRadius: RADIOS.pill,
            },
          ]}
        >
          <Text
            style={[
              tipografia.caption,
              {
                color: !filtroStockCritico
                  ? colores.acentoIntenso
                  : colores.tintaSecundaria,
              },
            ]}
          >
            Todos ({totalCatalogo})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onCambiarFiltroCritico(true)}
          accessibilityRole="button"
          accessibilityState={{ selected: filtroStockCritico }}
          style={[
            styles.chipOpcion,
            {
              minHeight: puntoMinimo,
              backgroundColor: filtroStockCritico
                ? colores.advertenciaSuave
                : colores.superficieHundida,
              borderColor: filtroStockCritico
                ? colores.puntoEstado.preparando
                : colores.borde,
              borderRadius: RADIOS.pill,
            },
          ]}
        >
          <Text
            style={[
              tipografia.caption,
              {
                color: filtroStockCritico
                  ? colores.advertencia
                  : colores.tintaSecundaria,
              },
            ]}
          >
            Stock crítico (≤{STOCK_CRITICO_MAX} un.)
          </Text>
        </Pressable>
      </View>

      {mensajeStockLive ? (
        <View
          accessibilityLiveRegion="assertive"
          style={[
            styles.alertaInline,
            {
              backgroundColor: colores.advertenciaSuave,
              borderRadius: RADIOS.sm,
            },
          ]}
        >
          <Icon name="triangle-alert" size={15} color={colores.advertencia} />
          <Text
            style={[tipografia.caption, { color: colores.advertencia, flex: 1 }]}
          >
            {mensajeStockLive}
          </Text>
        </View>
      ) : null}

      {errorProductos ? (
        <View
          accessibilityLiveRegion="assertive"
          style={[
            styles.alertaInline,
            { backgroundColor: colores.errorSuave, borderRadius: RADIOS.sm },
          ]}
        >
          <Icon name="circle-alert" size={15} color={colores.error} />
          <Text
            accessibilityRole="alert"
            style={[tipografia.caption, { color: colores.error, flex: 1 }]}
          >
            {errorProductos}
          </Text>
        </View>
      ) : null}

      {productosFiltrados.length === 0 ? (
        <View
          style={[
            styles.vacioCaja,
            {
              backgroundColor: colores.superficieHundida,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <Text
            style={[
              tipografia.caption,
              { color: colores.tintaSecundaria, textAlign: "center" },
            ]}
          >
            No hay prendas que coincidan con los filtros actuales.
          </Text>
          <Boton
            etiqueta="Limpiar filtros"
            variante="secundario"
            compacto
            onPress={onLimpiarFiltros}
          />
        </View>
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(prod) => prod.id}
          scrollEnabled={false}
          initialNumToRender={10}
          windowSize={5}
          contentContainerStyle={styles.productosLista}
          renderItem={({ item: prod }) => (
            <TarjetaProductoSelector
              prod={prod}
              variante={varianteActivaDe(prod)}
              lineasPedido={lineasPedido}
              onSeleccionarTalla={onSeleccionarTalla}
              onCambiarCantidadSku={onCambiarCantidadSku}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHeadFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  panelHead: { gap: 2 },
  alertaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
  },
  vacioCaja: { padding: ESPACIOS.md, alignItems: "center", gap: ESPACIOS.sm },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm },
  chipOpcion: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  chipMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  productosLista: { gap: ESPACIOS.md },
});
