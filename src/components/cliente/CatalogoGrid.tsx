// ─── Grilla Virtualizada de Catálogo Cliente (FlatList #6, #7, #8) ─

import React from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { ProductoCatalogoCard } from "../ProductoCatalogoCard";
import { useTema } from "../../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { ProductoCatalogoAdmin } from "../../types/pedido";

interface Props {
  titulo: string;
  subtitulo?: string;
  productos: ProductoCatalogoAdmin[];
  columnasDesktop: 3 | 4;
  onAgregar: (prod: ProductoCatalogoAdmin) => void;
  tallaSeleccionadaDe: (prod: ProductoCatalogoAdmin) => string | undefined;
  onSeleccionarTalla: (prod: ProductoCatalogoAdmin, sku: string) => void;
}

export function CatalogoGrid({
  titulo,
  subtitulo,
  productos,
  columnasDesktop,
  onAgregar,
  tallaSeleccionadaDe,
  onSeleccionarTalla,
}: Props) {
  const { width } = useWindowDimensions();
  const { colores, tipografia, modo } = useTema();
  const numColumns =
    width >= BREAKPOINTS.tablet ? columnasDesktop : width >= 540 ? 2 : 1;
  const maxAnchoCol =
    numColumns > 1 ? `${Math.floor(100 / numColumns) - 1}%` : "100%";

  return (
    <View
      style={[
        styles.panel,
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
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
            {subtitulo}
          </Text>
        ) : null}
      </View>

      <FlatList
        key={`catalogo-cols-${numColumns}`}
        data={productos}
        keyExtractor={(prod) => prod.id}
        numColumns={numColumns}
        scrollEnabled={false}
        initialNumToRender={4}
        windowSize={5}
        contentContainerStyle={styles.lista}
        columnWrapperStyle={numColumns > 1 ? styles.fila : undefined}
        renderItem={({ item: prod }) => (
          <View style={{ flex: 1, maxWidth: maxAnchoCol as `${number}%` }}>
            <ProductoCatalogoCard
              producto={prod}
              onAgregar={onAgregar}
              tallaSeleccionada={tallaSeleccionadaDe(prod)}
              onSeleccionarTalla={(sku) => onSeleccionarTalla(prod, sku)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  panelHead: { gap: 2 },
  lista: { gap: ESPACIOS.md },
  fila: { gap: ESPACIOS.md },
});
