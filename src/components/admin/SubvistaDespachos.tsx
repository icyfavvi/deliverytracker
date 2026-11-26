// ─── Subvista Admin: Control de Despachos ────────────────────────

import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { TarjetaMetrica } from "../TarjetaMetrica";
import { TRANSPORTISTAS } from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  AnaliticaOperacion,
  Pedido,
  Transportista,
} from "../../types/pedido";
import { adminStyles as styles } from "./estilosAdmin";

interface Props {
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onNuevoPedido: () => void;
  onAvanzar: (codigo: string) => void;
}

export function AdminDespachosView({
  pedidos,
  analitica,
  onNuevoPedido,
  onAvanzar,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const [courierFiltro, setCourierFiltro] = useState<"Todos" | Transportista>(
    "Todos"
  );

  const lista = useMemo(() => {
    if (courierFiltro === "Todos") return pedidos;
    return pedidos.filter((p) => {
      if (p.transportista) return p.transportista === courierFiltro;
      return p.metodoEnvio.toLowerCase().includes(courierFiltro.toLowerCase());
    });
  }, [pedidos, courierFiltro]);

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            OPERACIÓN / LOGÍSTICA
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Los <Text style={{ color: colores.acentoIntenso }}>despachos.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Control por transportista de cada salida desde bodega RM.
          </Text>
        </View>
        <Boton
          etiqueta="Crear despacho"
          icono="send"
          onPress={onNuevoPedido}
        />
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Por preparar"
          valor={analitica.porEstado.recibido + analitica.porEstado.preparando}
          subtitulo="Confirmado + preparando"
          icono="package"
          tono="advertencia"
        />
        <TarjetaMetrica
          etiqueta="En ruta"
          valor={analitica.porEstado.listo}
          subtitulo="Con transportista"
          icono="truck"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Entregados"
          valor={analitica.entregados}
          subtitulo="Completados"
          icono="circle-check"
          tono="exito"
        />
        <TarjetaMetrica
          etiqueta="Total activos"
          valor={analitica.activos}
          subtitulo="En operación"
          icono="activity"
          tono="neutro"
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
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Control de despachos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsWrap}
          >
            {(["Todos", ...TRANSPORTISTAS.map((t) => t.id)] as const).map(
              (c) => {
                const act = courierFiltro === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCourierFiltro(c)}
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
                      {c}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        </View>

        {lista.length === 0 ? (
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
              No hay despachos para el filtro seleccionado.
            </Text>
          </View>
        ) : (
          <FlatList
            data={lista}
            keyExtractor={(p) => p.codigo}
            scrollEnabled={false}
            initialNumToRender={10}
            windowSize={5}
            contentContainerStyle={styles.listaCompacta}
            renderItem={({ item: p }) => (
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
                  >
                    #{p.codigo} · {p.clienteNombre}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {p.comuna} · {p.metodoEnvio}
                  </Text>
                </View>

                <View style={styles.skuControles}>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  {p.estado !== "entregado" ? (
                    <Boton
                      etiqueta="Avanzar"
                      iconoDerecha="arrow-right"
                      compacto
                      onPress={() => onAvanzar(p.codigo)}
                    />
                  ) : null}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
