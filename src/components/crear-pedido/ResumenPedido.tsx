// ─── Bloque 4: Resumen Sticky de Pedido Admin (FlatList #14) ──────

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { Icon } from "../Icon";
import { ENVIO_GRATIS_DESDE_CLP } from "../../services/operacionesMock";
import { ConflictoStock } from "../../services/pedidosApi";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  ItemPedido,
  MetodoPago,
  ProductoCatalogoAdmin,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { PanelPagoUmbral } from "./PanelPagoUmbral";

interface Props {
  lineasPedido: ItemPedido[];
  catalogo: ProductoCatalogoAdmin[];
  stockActualPorSku: Record<string, number>;
  conflictosStock: ConflictoStock[];
  errorProductos?: string;
  desglose: { subtotal: number; ivaIncluido: number; envio: number; total: number };
  metodoPago: MetodoPago;
  umbralTexto: string;
  umbralConfirmacion: number;
  enviando: boolean;
  onAjustarLineaAMaximo: (sku: string, maximo: number) => void;
  onQuitarLinea: (
    prod: ProductoCatalogoAdmin,
    sku: string,
    talla: string,
    disp: number,
    delta: number
  ) => void;
  onCambiarMetodoPago: (m: MetodoPago) => void;
  onCambiarUmbralTexto: (txt: string) => void;
  onConfirmar: () => void;
}

export function ResumenPedido({
  lineasPedido,
  catalogo,
  stockActualPorSku,
  conflictosStock,
  errorProductos,
  desglose,
  metodoPago,
  umbralTexto,
  umbralConfirmacion,
  enviando,
  onAjustarLineaAMaximo,
  onQuitarLinea,
  onCambiarMetodoPago,
  onCambiarUmbralTexto,
  onConfirmar,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

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
        <Text
          style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
        >
          BLOQUE 4 · RESUMEN
        </Text>
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Detalle del pedido
        </Text>
      </View>

      {lineasPedido.length === 0 ? (
        <View
          style={[
            styles.vacioResumen,
            {
              backgroundColor: colores.superficieHundida,
              borderColor: errorProductos ? colores.error : colores.borde,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <Icon
            name="shopping-bag"
            size={22}
            color={errorProductos ? colores.error : colores.tintaTerciaria}
          />
          <Text
            style={[
              tipografia.caption,
              {
                color: errorProductos ? colores.error : colores.tintaSecundaria,
                textAlign: "center",
              },
            ]}
          >
            {errorProductos ??
              "Sin prendas agregadas todavía. Selecciona tallas en el Bloque 2."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={lineasPedido}
          keyExtractor={(linea) => linea.sku ?? linea.nombre}
          scrollEnabled={false}
          initialNumToRender={10}
          contentContainerStyle={styles.listaLineas}
          renderItem={({ item: linea }) => {
            const disp = linea.sku ? (stockActualPorSku[linea.sku] ?? 0) : 99;
            const enConflicto = linea.cantidad > disp;
            const prodRef = catalogo.find((p) =>
              p.variantes.some((v) => v.sku === linea.sku)
            );
            return (
              <View
                style={[
                  styles.lineaItem,
                  {
                    backgroundColor: enConflicto
                      ? colores.errorSuave
                      : colores.superficieHundida,
                    borderColor: enConflicto ? colores.error : colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <View style={styles.lineaItemInfo}>
                  <Text
                    style={[tipografia.etiqueta, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {linea.cantidad}× {linea.nombre}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Talla {linea.talla} · {linea.sku}
                  </Text>
                  {enConflicto ? (
                    <View style={styles.conflictoLineaFila}>
                      <Text
                        accessibilityRole="alert"
                        style={[tipografia.caption, { color: colores.error }]}
                      >
                        Stock actual: {disp} un.
                      </Text>
                      <Pressable
                        onPress={() =>
                          linea.sku && onAjustarLineaAMaximo(linea.sku, disp)
                        }
                        accessibilityRole="button"
                        style={styles.linkAjustar}
                      >
                        <Text
                          style={[
                            tipografia.caption,
                            {
                              color: colores.acentoIntenso,
                              fontFamily: FUENTES.semi,
                            },
                          ]}
                        >
                          {disp === 0 ? "Quitar" : `Ajustar a ${disp}`}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <View style={styles.lineaDerecha}>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    {formatearCLP((linea.precioUnitario ?? 0) * linea.cantidad)}
                  </Text>
                  {prodRef && linea.sku ? (
                    <Pressable
                      onPress={() =>
                        onQuitarLinea(
                          prodRef,
                          linea.sku!,
                          linea.talla ?? "",
                          disp,
                          -linea.cantidad
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${linea.nombre} del pedido`}
                      style={{
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="trash-2" size={16} color={colores.error} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      {conflictosStock.length > 0 ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[
            styles.alertaStock,
            {
              backgroundColor: colores.errorSuave,
              borderColor: colores.error,
              borderRadius: RADIOS.sm,
            },
          ]}
        >
          <Icon name="triangle-alert" size={16} color={colores.error} />
          <Text style={[tipografia.caption, { color: colores.error, flex: 1 }]}>
            {conflictosStock.length} ítem(s) superan el stock actual disponible.
            Ajusta antes de confirmar.
          </Text>
        </View>
      ) : null}

      <View
        accessibilityLiveRegion="polite"
        style={[styles.desgloseCaja, { borderTopColor: colores.borde }]}
      >
        <View style={styles.filaResumen}>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            Subtotal
          </Text>
          <Text style={[tipografia.micro, { color: colores.tinta }]}>
            {formatearCLP(desglose.subtotal)}
          </Text>
        </View>

        <View style={styles.filaResumen}>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            IVA 19% incluido
          </Text>
          <Text
            style={[tipografia.micro, { color: colores.tintaSecundaria }]}
          >
            {formatearCLP(desglose.ivaIncluido)}
          </Text>
        </View>

        <View style={styles.filaResumen}>
          <View style={styles.envioLabel}>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Envío
            </Text>
            {desglose.subtotal > 0 && desglose.envio === 0 ? (
              <View
                style={[
                  styles.pillGratis,
                  {
                    backgroundColor: colores.exitoSuave,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.exito, fontFamily: FUENTES.semi },
                  ]}
                >
                  Gratis &gt;$80k
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              tipografia.micro,
              {
                color:
                  desglose.subtotal > 0 && desglose.envio === 0
                    ? colores.exito
                    : colores.tinta,
              },
            ]}
          >
            {desglose.subtotal === 0
              ? "$0"
              : desglose.envio === 0
                ? "Gratis"
                : formatearCLP(desglose.envio)}
          </Text>
        </View>

        {desglose.subtotal > 0 &&
        desglose.subtotal < ENVIO_GRATIS_DESDE_CLP ? (
          <Text style={[tipografia.caption, { color: colores.acentoIntenso }]}>
            Faltan {formatearCLP(ENVIO_GRATIS_DESDE_CLP - desglose.subtotal)}{" "}
            para envío gratis.
          </Text>
        ) : null}

        <View style={[styles.totalLinea, { borderTopColor: colores.borde }]}>
          <Text style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}>
            Total CLP
          </Text>
          <Text style={[tipografia.metrica, { color: colores.tinta }]}>
            {formatearCLP(desglose.total)}
          </Text>
        </View>
      </View>

      <PanelPagoUmbral
        metodoPago={metodoPago}
        umbralTexto={umbralTexto}
        umbralConfirmacion={umbralConfirmacion}
        onCambiarMetodoPago={onCambiarMetodoPago}
        onCambiarUmbralTexto={onCambiarUmbralTexto}
      />

      <Boton
        etiqueta={enviando ? "Confirmando pedido…" : "Confirmar pedido"}
        icono="check"
        cargando={enviando}
        deshabilitado={enviando}
        anchoCompleto
        onPress={onConfirmar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHead: { gap: 2 },
  vacioResumen: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  listaLineas: { gap: ESPACIOS.sm },
  lineaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  lineaItemInfo: { flex: 1, minWidth: 0, gap: 2 },
  conflictoLineaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: 2,
  },
  linkAjustar: { paddingVertical: 4 },
  lineaDerecha: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.xs },
  alertaStock: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  desgloseCaja: { borderTopWidth: 1, paddingTop: ESPACIOS.md, gap: ESPACIOS.sm },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  envioLabel: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.sm },
  pillGratis: { paddingHorizontal: ESPACIOS.sm, paddingVertical: 2 },
  totalLinea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: ESPACIOS.sm,
    marginTop: ESPACIOS.xs,
  },
});
