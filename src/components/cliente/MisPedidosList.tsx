// ─── Subvista Cliente: Mis Pedidos (FlatList #5 + CatalogoGrid #7) ─

import React from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  ETIQUETAS_ESTADO,
  EstadoPedido,
  FLUJO_ESTADOS,
  Pedido,
  ProductoCatalogoAdmin,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { CatalogoGrid } from "./CatalogoGrid";

export type FiltroCliente = "todos" | EstadoPedido;

interface Props {
  misPedidosTotal: number;
  pedidosFiltrados: Pedido[];
  filtroHistorial: FiltroCliente;
  catalogoDestacado: ProductoCatalogoAdmin[];
  onCambiarFiltro: (filtro: FiltroCliente) => void;
  onNuevoPedido: () => void;
  onSeleccionarPedido: (codigo: string) => void;
  onAgregarAlCarrito: (prod: ProductoCatalogoAdmin) => void;
  tallaSeleccionadaDe: (prod: ProductoCatalogoAdmin) => string | undefined;
  onSeleccionarTalla: (prod: ProductoCatalogoAdmin, sku: string) => void;
}

export function MisPedidosList({
  misPedidosTotal,
  pedidosFiltrados,
  filtroHistorial,
  catalogoDestacado,
  onCambiarFiltro,
  onNuevoPedido,
  onSeleccionarPedido,
  onAgregarAlCarrito,
  tallaSeleccionadaDe,
  onSeleccionarTalla,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  const filtros: { id: FiltroCliente; label: string }[] = [
    { id: "todos", label: `Todos · ${misPedidosTotal}` },
    ...FLUJO_ESTADOS.map((est) => ({
      id: est,
      label: ETIQUETAS_ESTADO[est],
    })),
  ];

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            TU ACTIVIDAD
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Mis <Text style={{ color: colores.acentoIntenso }}>pedidos.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Revisa el estado de cada compra y selecciona cualquiera para
            rastrear.
          </Text>
        </View>
        <Boton etiqueta="Nuevo pedido" icono="plus" onPress={onNuevoPedido} />
      </View>

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
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Historial de pedidos
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsFila}
        >
          {filtros.map((op) => {
            const act = filtroHistorial === op.id;
            return (
              <Pressable
                key={op.id}
                onPress={() => onCambiarFiltro(op.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: act }}
                style={[
                  styles.chipFiltro,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: act
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: act ? colores.acento : colores.borde,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: act
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                      fontFamily: act ? FUENTES.semi : FUENTES.medio,
                    },
                  ]}
                >
                  {op.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {pedidosFiltrados.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: colores.superficieHundida,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              No hay pedidos en esta categoría todavía.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pedidosFiltrados}
            keyExtractor={(p) => p.codigo}
            scrollEnabled={false}
            initialNumToRender={10}
            windowSize={5}
            contentContainerStyle={styles.miniLista}
            renderItem={({ item: p }) => (
              <Pressable
                onPress={() => onSeleccionarPedido(p.codigo)}
                accessibilityRole="button"
                accessibilityLabel={`Ver seguimiento del pedido ${p.codigo}`}
                style={[
                  styles.historialRow,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.historialIzq}>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    #{p.codigo}
                  </Text>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {p.items[0]?.nombre ?? "Orden Atelier Noir"}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {p.comuna} · {formatearCLP(p.totalEstimado)}
                  </Text>
                </View>

                <View style={styles.historialDer}>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  <Icon
                    name="arrow-right"
                    size={16}
                    color={colores.acentoIntenso}
                  />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <CatalogoGrid
        titulo="Volver a comprar"
        productos={catalogoDestacado}
        columnasDesktop={3}
        onAgregar={onAgregarAlCarrito}
        tallaSeleccionadaDe={tallaSeleccionadaDe}
        onSeleccionarTalla={onSeleccionarTalla}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  seccionStack: { gap: ESPACIOS.lg },
  pageHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  pageHeadLeft: { flex: 1, minWidth: 220, gap: 4 },
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  chipsFila: { gap: ESPACIOS.sm },
  chipFiltro: {
    justifyContent: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  emptyBox: { padding: ESPACIOS.lg, alignItems: "center" },
  miniLista: { gap: ESPACIOS.sm },
  historialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  historialIzq: { flex: 1, minWidth: 160, gap: 2 },
  historialDer: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.sm },
});
