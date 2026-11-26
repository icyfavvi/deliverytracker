// ─── Catálogo Rápido Horizontal por SKU (FlatList #15) ────────────

import React, { useCallback, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../../theme/tokens";
import { formatearCLP } from "../../utils/formato";

export interface PrendaRapidaSku {
  id: string;
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  precio: number;
  stock: number;
}

interface Props {
  catalogo: PrendaRapidaSku[];
  onAgregarPrenda: (cat: PrendaRapidaSku) => void;
}

export function CatalogoSKU({ catalogo, onAgregarPrenda }: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();
  const flatListRef = useRef<FlatList<PrendaRapidaSku>>(null);
  const scrollCatalogoX = useRef(0);

  const desplazarCatalogo = useCallback((direccionPaso: "izq" | "der") => {
    const paso = 220;
    const nuevoX =
      direccionPaso === "izq"
        ? Math.max(0, scrollCatalogoX.current - paso)
        : scrollCatalogoX.current + paso;
    scrollCatalogoX.current = nuevoX;
    flatListRef.current?.scrollToOffset({
      offset: nuevoX,
      animated: true,
    });
  }, []);

  return (
    <View>
      <View style={styles.catalogoHeader}>
        <Text
          style={[
            tipografia.eyebrowMono,
            { color: colores.tintaTerciaria },
          ]}
        >
          PRENDAS EN STOCK (SKU)
        </Text>
        <View style={styles.catalogoFlechas}>
          <Pressable
            onPress={() => desplazarCatalogo("izq")}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la izquierda"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor: colores.borde,
                backgroundColor: colores.superficieHundida,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Icon name="chevron-left" size={18} color={colores.tinta} />
          </Pressable>
          <Pressable
            onPress={() => desplazarCatalogo("der")}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la derecha"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor: colores.borde,
                backgroundColor: colores.superficieHundida,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Icon name="chevron-right" size={18} color={colores.tinta} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={catalogo}
        keyExtractor={(cat) => cat.sku}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={6}
        contentContainerStyle={styles.catalogoFila}
        onScroll={(e) => {
          scrollCatalogoX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        renderItem={({ item: cat }) => {
          const agotado = cat.stock <= 0;
          return (
            <Pressable
              onPress={() => onAgregarPrenda(cat)}
              disabled={agotado}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${cat.nombre}`}
              style={({ pressed }) => [
                styles.prendaRapida,
                {
                  backgroundColor: colores.superficieHundida,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.md,
                  opacity: agotado ? 0.5 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={styles.prendaRapidaTop}>
                <View
                  style={[
                    styles.prendaTag,
                    {
                      backgroundColor: colores.acentoSuave,
                      borderRadius: RADIOS.pill,
                    },
                  ]}
                >
                  <Icon
                    name={agotado ? "x" : "plus"}
                    size={13}
                    color={colores.acentoIntenso}
                  />
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.acentoIntenso },
                    ]}
                  >
                    {agotado ? "Agotado" : `${cat.talla} (${cat.stock})`}
                  </Text>
                </View>
                <Text style={[tipografia.micro, { color: colores.tinta }]}>
                  {formatearCLP(cat.precio)}
                </Text>
              </View>
              <Text
                style={[
                  tipografia.cuerpoFuerte,
                  styles.prendaRapidaNombre,
                  { color: colores.tinta },
                ]}
                numberOfLines={2}
              >
                {cat.nombre}
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                numberOfLines={1}
              >
                {cat.color} · {cat.sku}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  catalogoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ESPACIOS.sm,
  },
  catalogoFlechas: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonFlecha: {
    borderRadius: RADIOS.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  catalogoFila: {
    gap: ESPACIOS.sm,
    paddingBottom: ESPACIOS.md,
  },
  prendaRapida: {
    width: 214,
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.xs + 2,
    cursor: "pointer",
  },
  prendaRapidaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  prendaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: ESPACIOS.sm,
    paddingVertical: 3,
  },
  prendaRapidaNombre: {
    minHeight: 42,
  },
});
