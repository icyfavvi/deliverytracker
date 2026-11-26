// ─── Subvista Admin: Bodega / Inventario SKU ─────────────────────

import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Icon } from "../Icon";
import { TarjetaMetrica } from "../TarjetaMetrica";
import { STOCK_CRITICO_MAX } from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { AnaliticaOperacion } from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { adminStyles as styles } from "./estilosAdmin";

interface Props {
  analitica: AnaliticaOperacion;
  busqueda: string;
  onReponer: (sku: string, cantidad: number) => void;
}

export function AdminBodegaView({ analitica, busqueda, onReponer }: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const [filtro, setFiltro] = useState<"todos" | "critico" | "saludable">(
    "todos"
  );

  const items = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return analitica.inventarioPlano.filter((item) => {
      if (filtro === "critico" && item.stock > STOCK_CRITICO_MAX) return false;
      if (filtro === "saludable" && item.stock <= STOCK_CRITICO_MAX)
        return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
      );
    });
  }, [analitica.inventarioPlano, filtro, busqueda]);

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            OPERACIÓN / INVENTARIO
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            La <Text style={{ color: colores.acentoIntenso }}>bodega.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Controla el stock disponible por talla SKU y repone unidades en
            vivo.
          </Text>
        </View>
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Unidades totales"
          valor={analitica.stockTotalUnidades}
          subtitulo="Disponibles para despacho"
          icono="layers"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="SKUs activos"
          valor={analitica.skusActivosCount}
          subtitulo="Variantes registradas"
          icono="tag"
          tono="neutro"
        />
        <TarjetaMetrica
          etiqueta="Alertas críticas"
          valor={analitica.skusCriticos.length}
          subtitulo={`≤ ${STOCK_CRITICO_MAX} unidades`}
          icono="triangle-alert"
          tono="advertencia"
        />
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
        <View style={styles.panelHeadRow}>
          <View>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Inventario actual
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Sincronizado con cada pedido creado
            </Text>
          </View>
          <View style={styles.chipsWrap}>
            {(
              [
                {
                  id: "todos",
                  label: `Todos (${analitica.inventarioPlano.length})`,
                },
                {
                  id: "critico",
                  label: `Crítico (${analitica.skusCriticos.length})`,
                },
                { id: "saludable", label: "Saludable" },
              ] as const
            ).map((op) => {
              const act = filtro === op.id;
              return (
                <Pressable
                  key={op.id}
                  onPress={() => setFiltro(op.id)}
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
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(sku) => sku.sku}
          scrollEnabled={false}
          initialNumToRender={10}
          windowSize={5}
          contentContainerStyle={styles.listaCompacta}
          renderItem={({ item: sku }) => {
            const agotado = sku.stock === 0;
            const critico = sku.stock > 0 && sku.stock <= STOCK_CRITICO_MAX;
            const pct = Math.min(
              100,
              Math.round((sku.stock / Math.max(1, sku.stockInicial)) * 100)
            );
            return (
              <View
                style={[
                  styles.skuRow,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.skuInfo}>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {sku.nombre}
                  </Text>
                  <Text
                    style={[tipografia.micro, { color: colores.tintaSecundaria }]}
                  >
                    {sku.sku} · Talla {sku.talla} · {formatearCLP(sku.precio)}
                  </Text>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.borde, marginTop: 4 },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: agotado
                            ? colores.error
                            : critico
                              ? colores.puntoEstado.preparando
                              : colores.puntoEstado.entregado,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.skuControles}>
                  <View
                    style={[
                      styles.pillEstadoSku,
                      {
                        backgroundColor: agotado
                          ? colores.errorSuave
                          : critico
                            ? colores.advertenciaSuave
                            : colores.exitoSuave,
                        borderRadius: RADIOS.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tipografia.micro,
                        {
                          color: agotado
                            ? colores.error
                            : critico
                              ? colores.advertencia
                              : colores.exito,
                        },
                      ]}
                    >
                      {agotado
                        ? "AGOTADO"
                        : critico
                          ? `CRÍTICO (${sku.stock})`
                          : `SALUDABLE (${sku.stock})`}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onReponer(sku.sku, 5)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ingresar 5 unidades a ${sku.nombre} talla ${sku.talla}`}
                    style={[
                      styles.btnReponer,
                      {
                        minHeight: puntoMinimo,
                        backgroundColor: colores.superficie,
                        borderColor: colores.bordeFuerte,
                        borderRadius: RADIOS.sm,
                      },
                    ]}
                  >
                    <Icon name="plus" size={14} color={colores.acentoIntenso} />
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.acentoIntenso, fontFamily: FUENTES.semi },
                      ]}
                    >
                      5 un.
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}
