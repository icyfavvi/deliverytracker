// ─── Subvista Admin: Seguimiento en Vivo y Geografía RM ─────────

import React, { useMemo } from "react";
import { FlatList, Text, View, useWindowDimensions } from "react-native";

import { Boton } from "../Boton";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { AnaliticaOperacion, Pedido } from "../../types/pedido";
import { adminStyles as styles } from "./estilosAdmin";

interface Props {
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onRefrescar: () => void;
  onAvanzar: (codigo: string) => void;
}

export function AdminSeguimientoView({
  pedidos,
  analitica,
  onRefrescar,
  onAvanzar,
}: Props) {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo } = useTema();

  const enTransito = useMemo(
    () =>
      pedidos.filter(
        (p) => p.estado === "preparando" || p.estado === "listo"
      ),
    [pedidos]
  );

  const tasaEntrega =
    analitica.total > 0
      ? Math.round((analitica.entregados / analitica.total) * 100)
      : 0;

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            OPERACIÓN / MONITOREO
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Seguimiento{" "}
            <Text style={{ color: colores.acentoIntenso }}>en vivo.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Monitorea pedidos activos y concentración de entregas por comuna RM.
          </Text>
        </View>
        <Boton
          etiqueta="Actualizar"
          icono="refresh-cw"
          variante="secundario"
          onPress={onRefrescar}
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
                Pedidos en tránsito
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                {enTransito.length} despachos en preparación o ruta
              </Text>
            </View>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: colores.acentoSuave,
                  borderRadius: RADIOS.pill,
                },
              ]}
            >
              <View
                style={[
                  styles.mixDot,
                  { backgroundColor: colores.acentoIntenso },
                ]}
              />
              <Text style={[tipografia.micro, { color: colores.acentoIntenso }]}>
                LIVE
              </Text>
            </View>
          </View>

          {enTransito.length === 0 ? (
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
                Sin despachos en tránsito en este momento.
              </Text>
            </View>
          ) : (
            <FlatList
              data={enTransito}
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
                      #{p.codigo} · {p.items[0]?.nombre ?? p.clienteNombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {p.metodoEnvio} · {p.comuna}
                    </Text>
                  </View>
                  <Boton
                    etiqueta={
                      p.estado === "preparando"
                        ? "Despachar"
                        : "Marcar entregado"
                    }
                    compacto
                    onPress={() => onAvanzar(p.codigo)}
                  />
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
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Rendimiento logístico
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Tasa de entregas completadas
            </Text>
          </View>

          <View style={styles.rendimientoBox}>
            <Text style={[tipografia.metrica, { color: colores.tinta }]}>
              {tasaEntrega}%
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              {analitica.entregados} completadas de {analitica.total} órdenes
            </Text>
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: colores.superficieHundida,
                  height: 10,
                  marginTop: ESPACIOS.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${tasaEntrega}%`,
                    backgroundColor: colores.puntoEstado.entregado,
                  },
                ]}
              />
            </View>
          </View>
        </View>
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
        <View style={styles.panelHead}>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Concentración por comuna (RM)
          </Text>
          <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
            Distribución geográfica en vivo de las órdenes creadas
          </Text>
        </View>

        {analitica.porComuna.length === 0 ? (
          <View
            style={[
              styles.emptyMini,
              {
                backgroundColor: colores.superficieHundida,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Icon name="map" size={20} color={colores.tintaTerciaria} />
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Cuando ingresen pedidos verás aquí las comunas con mayor demanda.
            </Text>
          </View>
        ) : (
          <FlatList
            data={analitica.porComuna}
            keyExtractor={(c) => c.comuna}
            scrollEnabled={false}
            contentContainerStyle={styles.barrasEtapa}
            renderItem={({ item: c }) => (
              <View style={styles.barraRow}>
                <View style={styles.barraLabels}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {c.comuna}
                  </Text>
                  <Text
                    style={[
                      tipografia.micro,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {c.cantidad} pedido(s) · {c.porcentaje}%
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
                        width: `${c.porcentaje}%`,
                        backgroundColor: colores.acento,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
