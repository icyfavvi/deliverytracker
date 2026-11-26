// ─── Subvista Cliente: Resumen (FlatList #10 + CatalogoGrid #6) ─

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { Icon } from "../Icon";
import { StepperProgreso } from "../StepperProgreso";
import { TarjetaMetrica } from "../TarjetaMetrica";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  ETIQUETAS_ESTADO,
  Pedido,
  ProductoCatalogoAdmin,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { CatalogoGrid } from "./CatalogoGrid";

interface Props {
  esAncho: boolean;
  primerNombreCliente: string;
  misPedidos: Pedido[];
  misPedidosActivosCount: number;
  stockTotalUnidades: number;
  pedidoActivoDestacado: Pedido | null;
  catalogoDestacado: ProductoCatalogoAdmin[];
  onAbrirModalNombre: () => void;
  onIrVista: (vista: "mis-pedidos" | "seguimiento") => void;
  onSeleccionarPedido: (codigo: string) => void;
  onAgregarAlCarrito: (prod: ProductoCatalogoAdmin) => void;
  tallaSeleccionadaDe: (prod: ProductoCatalogoAdmin) => string | undefined;
  onSeleccionarTalla: (prod: ProductoCatalogoAdmin, sku: string) => void;
}

export function ResumenCliente({
  esAncho,
  primerNombreCliente,
  misPedidos,
  misPedidosActivosCount,
  stockTotalUnidades,
  pedidoActivoDestacado,
  catalogoDestacado,
  onAbrirModalNombre,
  onIrVista,
  onSeleccionarPedido,
  onAgregarAlCarrito,
  tallaSeleccionadaDe,
  onSeleccionarTalla,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            MI ESPACIO · CHILE
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Hola,{" "}
            <Text style={{ color: colores.acentoIntenso }}>
              {primerNombreCliente}.
            </Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Todo lo que necesitas en un solo lugar.
          </Text>
        </View>

        <View style={styles.accionesHead}>
          <Boton
            etiqueta="Cambiar nombre"
            icono="pencil"
            variante="secundario"
            onPress={onAbrirModalNombre}
          />
          <Boton
            etiqueta="Explorar cápsula"
            iconoDerecha="arrow-right"
            onPress={() => onIrVista("mis-pedidos")}
          />
        </View>
      </View>

      <View
        style={[
          styles.heroCapsula,
          {
            backgroundColor: colores.panelOscuro,
            borderColor: colores.panelOscuroBorde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View pointerEvents="none" style={styles.aroExterno} />
        <View pointerEvents="none" style={styles.aroInterno} />

        <View style={styles.heroCapsulaContenido}>
          <View style={styles.heroCapsulaLeft}>
            <Text style={[tipografia.eyebrowMono, { color: "#9ab5ff" }]}>
              NUEVA CÁPSULA / FALL 26
            </Text>
            <Text style={styles.heroTituloGrande}>
              Diseñado para{"\n"}moverte{" "}
              <Text style={{ color: "#6f95ff" }}>distinto.</Text>
            </Text>
            <Text style={[tipografia.cuerpo, { color: "#c4cdd8" }]}>
              Texturas honestas, siluetas que viven en la calle y detalles hechos
              en Chile.
            </Text>
            <Pressable
              onPress={() => {
                if (catalogoDestacado[0])
                  onAgregarAlCarrito(catalogoDestacado[0]);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.heroCtaBlanco,
                {
                  minHeight: puntoMinimo,
                  borderRadius: RADIOS.sm,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: "#0a0d10", fontFamily: FUENTES.semi },
                ]}
              >
                Comprar cápsula
              </Text>
              <Icon name="arrow-right" size={16} color="#0a0d10" />
            </Pressable>
          </View>

          <View style={styles.heroGarmentWrap}>
            <View style={styles.heroGarmentBox}>
              <Icon name="shirt" size={52} color="#ffffff" />
              <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>NOIR</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="En tránsito"
          valor={String(misPedidosActivosCount).padStart(2, "0")}
          subtitulo="Órdenes activas"
          icono="truck"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Pedidos totales"
          valor={String(misPedidos.length).padStart(2, "0")}
          subtitulo="En tu cuenta"
          icono="package"
          tono="neutro"
        />
        <TarjetaMetrica
          etiqueta="Prendas en catálogo"
          valor={stockTotalUnidades}
          subtitulo="Stock disponible hoy"
          icono="sparkles"
          tono="exito"
        />
      </View>

      <View style={esAncho ? styles.dosColumnas : styles.unaColumna}>
        <View
          style={[
            styles.panel,
            esAncho && styles.colMayor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHeadRow}>
            <View>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                Seguimiento en vivo
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Consulta instantánea por código de orden
              </Text>
            </View>
            <Pressable
              onPress={() => onIrVista("seguimiento")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[tipografia.etiqueta, { color: colores.acentoIntenso }]}
              >
                Ir al buscador →
              </Text>
            </Pressable>
          </View>

          {pedidoActivoDestacado ? (
            <View style={styles.seguimientoVivoBox}>
              <View style={styles.tarjetaHeader}>
                <View>
                  <Text
                    style={[
                      tipografia.micro,
                      { color: colores.tintaTerciaria },
                    ]}
                  >
                    PEDIDO #{pedidoActivoDestacado.codigo}
                  </Text>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                  >
                    {pedidoActivoDestacado.items[0]?.nombre ?? "Orden Atelier"}
                  </Text>
                </View>
                <EstadoPedidoBadge
                  estado={pedidoActivoDestacado.estado}
                  compacto
                />
              </View>
              <StepperProgreso estado={pedidoActivoDestacado.estado} />
            </View>
          ) : (
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
                Aún no tienes pedidos activos. Crea una orden rápida abajo o
                ingresa un código en Seguimiento.
              </Text>
            </View>
          )}
        </View>

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
          <View style={styles.panelHeadRow}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Últimos pedidos
            </Text>
            <Pressable
              onPress={() => onIrVista("mis-pedidos")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[tipografia.etiqueta, { color: colores.acentoIntenso }]}
              >
                Ver todos →
              </Text>
            </Pressable>
          </View>

          {misPedidos.length === 0 ? (
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
                Sin compras previas en esta sesión.
              </Text>
            </View>
          ) : (
            <FlatList
              data={misPedidos.slice(0, 3)}
              keyExtractor={(p) => p.codigo}
              scrollEnabled={false}
              initialNumToRender={3}
              contentContainerStyle={styles.miniLista}
              renderItem={({ item: p }) => (
                <Pressable
                  onPress={() => onSeleccionarPedido(p.codigo)}
                  accessibilityRole="button"
                  style={[
                    styles.miniRow,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <View style={styles.flex}>
                    <Text
                      style={[tipografia.etiqueta, { color: colores.tinta }]}
                      numberOfLines={1}
                    >
                      #{p.codigo} · {p.items[0]?.nombre ?? "Prenda"}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {p.cancelado ? "Cancelado" : ETIQUETAS_ESTADO[p.estado]}
                    </Text>
                  </View>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    {formatearCLP(p.totalEstimado)}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>

      <CatalogoGrid
        titulo="Te puede gustar"
        subtitulo="Selección Atelier Noir · añade para comprar y rastrear al instante"
        productos={catalogoDestacado}
        columnasDesktop={4}
        onAgregar={onAgregarAlCarrito}
        tallaSeleccionadaDe={tallaSeleccionadaDe}
        onSeleccionarTalla={onSeleccionarTalla}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  seccionStack: { gap: ESPACIOS.lg },
  pageHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  pageHeadLeft: { flex: 1, minWidth: 220, gap: 4 },
  accionesHead: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm },
  heroCapsula: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  heroCapsulaContenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.lg,
  },
  heroCapsulaLeft: { flex: 1.4, minWidth: 220, gap: ESPACIOS.sm },
  heroTituloGrande: {
    color: "#ffffff",
    fontFamily: FUENTES.fuerte,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
  },
  heroCtaBlanco: {
    marginTop: ESPACIOS.xs,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ESPACIOS.sm,
    backgroundColor: "#ffffff",
    paddingHorizontal: ESPACIOS.lg,
    cursor: "pointer",
  },
  heroGarmentWrap: { alignItems: "center", justifyContent: "center" },
  heroGarmentBox: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  aroExterno: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.24)",
  },
  aroInterno: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(80, 200, 232, 0.2)",
  },
  metricasGrid: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.md },
  dosColumnas: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.lg,
  },
  unaColumna: { gap: ESPACIOS.lg },
  colMayor: { flex: 1.4, minWidth: 0 },
  colMenor: { flex: 0.9, minWidth: 0 },
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  seguimientoVivoBox: { gap: ESPACIOS.md },
  tarjetaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  emptyBox: { padding: ESPACIOS.lg, alignItems: "center" },
  miniLista: { gap: ESPACIOS.sm },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
});
