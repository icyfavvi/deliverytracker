// ─── Subvista Admin: Resumen de Operaciones ──────────────────────

import React from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { Icon } from "../Icon";
import { TarjetaMetrica } from "../TarjetaMetrica";
import { STOCK_CRITICO_MAX } from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { BREAKPOINTS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  AnaliticaOperacion,
  ETIQUETAS_ESTADO,
  FLUJO_ESTADOS,
  Pedido,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { adminStyles as styles } from "./estilosAdmin";

interface Props {
  nombreAdmin: string;
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onIrVista: (vista: "bodega" | "pedidos" | "despachos" | "seguimiento") => void;
  onNuevoPedido: () => void;
  onAvanzar: (codigo: string) => void;
}

export function AdminResumenView({
  nombreAdmin,
  pedidos,
  analitica,
  onIrVista,
  onNuevoPedido,
  onAvanzar,
}: Props) {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const primerNombre = nombreAdmin.split(" ")[0] || "Operaciones";

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            PANEL DE CONTROL · OPERACIONES
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Buen día,{" "}
            <Text style={{ color: colores.acentoIntenso }}>{primerNombre}.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Pulso en tiempo real de pedidos, despachos e inventario.
          </Text>
        </View>
        <Boton etiqueta="+ Nuevo pedido" onPress={onNuevoPedido} />
      </View>

      <View
        style={[
          styles.adminBanner,
          {
            backgroundColor: colores.panelOscuro,
            borderColor: colores.panelOscuroBorde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.bannerTextos}>
          <Text style={[tipografia.titulo, { color: "#ffffff" }]}>
            {analitica.total === 0
              ? "Bodega lista para recibir órdenes."
              : "La operación se mueve bien."}
          </Text>
          <Text style={[tipografia.cuerpo, { color: "#c4cdd8" }]}>
            {analitica.activos} pedidos activos en flujo ·{" "}
            {analitica.skusCriticos.length} SKUs en stock crítico requieren
            atención.
          </Text>
        </View>

        <View style={styles.bannerStat}>
          <Text style={[tipografia.subtitulo, { color: "#9ab5ff" }]}>
            {analitica.entregados}/{analitica.total}
          </Text>
          <Text style={[tipografia.caption, { color: "#c4cdd8" }]}>
            entregados hoy
          </Text>
        </View>
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Ventas netas"
          valor={formatearCLP(analitica.ventasNetas)}
          subtitulo="Acumulado sesión"
          icono="trending-up"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Pedidos"
          valor={analitica.total}
          subtitulo={`${analitica.activos} en curso`}
          icono="package"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Ticket promedio"
          valor={formatearCLP(analitica.ticketPromedio)}
          subtitulo="CLP c/ envío"
          icono="receipt"
          tono="exito"
        />
        <TarjetaMetrica
          etiqueta="Stock crítico"
          valor={analitica.skusCriticos.length}
          subtitulo={`SKUs ≤ ${STOCK_CRITICO_MAX} un.`}
          icono="triangle-alert"
          tono={analitica.skusCriticos.length > 0 ? "advertencia" : "exito"}
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
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Flujo de pedidos por etapa
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Distribución en vivo ({analitica.total} órdenes)
            </Text>
          </View>

          <View style={styles.barrasEtapa}>
            {FLUJO_ESTADOS.map((est) => {
              const count = analitica.porEstado[est];
              const pct =
                analitica.total > 0
                  ? Math.round((count / analitica.total) * 100)
                  : 0;
              return (
                <View key={est} style={styles.barraRow}>
                  <View style={styles.barraLabels}>
                    <Text
                      style={[tipografia.caption, { color: colores.tinta }]}
                    >
                      {ETIQUETAS_ESTADO[est]}
                    </Text>
                    <Text
                      style={[
                        tipografia.micro,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {count} ({pct}%)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.superficieHundida },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: colores.puntoEstado[est],
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
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
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Mix de categorías
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              {analitica.total > 0
                ? "Unidades en pedidos"
                : "Participación en inventario"}
            </Text>
          </View>

          <View style={styles.barrasEtapa}>
            {analitica.mixCategorias.map((cat, idx) => {
              const coloresCat = [
                colores.acento,
                colores.puntoEstado.entregado,
                colores.puntoEstado.preparando,
                colores.tintaSecundaria,
              ];
              return (
                <View key={cat.categoria} style={styles.mixFila}>
                  <View style={styles.mixIzq}>
                    <View
                      style={[
                        styles.mixDot,
                        {
                          backgroundColor:
                            coloresCat[idx % coloresCat.length],
                        },
                      ]}
                    />
                    <Text
                      style={[tipografia.caption, { color: colores.tinta }]}
                    >
                      {cat.categoria}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tipografia.micro,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {cat.porcentaje}% ({cat.unidades})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
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
                Pedidos recientes
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Últimas órdenes registradas
              </Text>
            </View>
            <Pressable
              onPress={() => onIrVista("pedidos")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: colores.acentoIntenso },
                ]}
              >
                Ver todos →
              </Text>
            </Pressable>
          </View>

          {pedidos.length === 0 ? (
            <View
              style={[
                styles.emptyMini,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Sin pedidos recientes aún. Crea uno o espera órdenes del cliente.
              </Text>
            </View>
          ) : (
            <FlatList
              data={pedidos.slice(0, 4)}
              keyExtractor={(p) => p.codigo}
              scrollEnabled={false}
              contentContainerStyle={styles.listaCompacta}
              renderItem={({ item: p }) => (
                <View
                  style={[
                    styles.filaCompacta,
                    {
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
                      #{p.codigo} · {p.clienteNombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                      numberOfLines={1}
                    >
                      {p.items[0]?.nombre ?? "Orden"} ·{" "}
                      {formatearCLP(p.totalEstimado)}
                    </Text>
                  </View>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  {p.estado !== "entregado" ? (
                    <Pressable
                      onPress={() => onAvanzar(p.codigo)}
                      accessibilityRole="button"
                      accessibilityLabel={`Avanzar pedido ${p.codigo}`}
                      style={[
                        styles.btnMini,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          backgroundColor: colores.superficie,
                          borderColor: colores.borde,
                          borderRadius: RADIOS.sm,
                        },
                      ]}
                    >
                      <Icon
                        name="arrow-right"
                        size={16}
                        color={colores.acentoIntenso}
                      />
                    </Pressable>
                  ) : null}
                </View>
              )}
            />
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
            <View>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                Stock crítico
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Requiere reposición
              </Text>
            </View>
            <Pressable
              onPress={() => onIrVista("bodega")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: colores.acentoIntenso },
                ]}
              >
                Ver bodega →
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={analitica.skusCriticos.slice(0, 4)}
            keyExtractor={(sku) => sku.sku}
            scrollEnabled={false}
            initialNumToRender={4}
            contentContainerStyle={styles.listaCompacta}
            renderItem={({ item: sku }) => {
              const pct = Math.min(
                100,
                Math.round((sku.stock / Math.max(1, sku.stockInicial)) * 100)
              );
              return (
                <View
                  style={[
                    styles.stockCriticoItem,
                    {
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <View style={styles.barraLabels}>
                    <Text
                      style={[
                        tipografia.etiqueta,
                        { color: colores.tinta, flex: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {sku.nombre} ({sku.talla})
                    </Text>
                    <Text
                      style={[
                        tipografia.micro,
                        {
                          color:
                            sku.stock === 0
                              ? colores.error
                              : colores.advertencia,
                        },
                      ]}
                    >
                      {sku.stock} un.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.borde },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor:
                            sku.stock === 0
                              ? colores.error
                              : colores.puntoEstado.preparando,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
}
