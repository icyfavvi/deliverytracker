// ─── Subvista Cliente: Seguimiento en Vivo (FlatList #11 + #8) ───

import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { EstadoUIRenderer } from "../EstadoUIRenderer";
import { Icon } from "../Icon";
import { StepperProgreso } from "../StepperProgreso";
import { esEstadoTerminal } from "../../hooks/pollingConfig";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  DESCRIPCIONES_ESTADO,
  ETIQUETAS_ESTADO,
  EstadoPedido,
  EstadoUI,
  Pedido,
  ProductoCatalogoAdmin,
} from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { BuscadorCodigo } from "./BuscadorCodigo";
import { CatalogoGrid } from "./CatalogoGrid";
import { TarjetaDestinoPedido } from "./TarjetaDestinoPedido";

function etiquetaEstadoHistorial(estado: string): string {
  if (estado === "cancelado") return "Cancelado";
  return ETIQUETAS_ESTADO[estado as EstadoPedido] ?? estado;
}

function formatearHoraHistorial(fecha: string): string {
  const instante = new Date(fecha);
  if (Number.isNaN(instante.getTime())) return "--:--";
  return instante.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  esAncho: boolean;
  codigoInput: string;
  codigoBuscado: string | null;
  errorCodigo: string | null;
  estadoPedido: EstadoUI<Pedido> | null;
  ultimoPedidoCodigo?: string;
  cancelando: boolean;
  ultimaActualizacion: string | null;
  pollingStatus: {
    frecuenciaSegundos: number;
    esFrecuenciaLenta: boolean;
    enSegundoPlano: boolean;
  };
  catalogoRecomendado: ProductoCatalogoAdmin[];
  inputRef: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
  onCambiarCodigo: (txt: string) => void;
  onBuscar: () => void;
  onLimpiarParaOtro: () => void;
  onSeleccionarPedido: (codigo: string) => void;
  onConsultarAhora: () => void;
  onCancelarPedido: (codigo: string) => void;
  onAgregarAlCarrito: (prod: ProductoCatalogoAdmin) => void;
  tallaSeleccionadaDe: (prod: ProductoCatalogoAdmin) => string | undefined;
  onSeleccionarTalla: (prod: ProductoCatalogoAdmin, sku: string) => void;
}

export function SeguimientoPedido({
  esAncho,
  codigoInput,
  codigoBuscado,
  errorCodigo,
  estadoPedido,
  ultimoPedidoCodigo,
  cancelando,
  ultimaActualizacion,
  pollingStatus,
  catalogoRecomendado,
  inputRef,
  onCambiarCodigo,
  onBuscar,
  onLimpiarParaOtro,
  onSeleccionarPedido,
  onConsultarAhora,
  onCancelarPedido,
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
            LOGÍSTICA
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Rastrea tu{" "}
            <Text style={{ color: colores.acentoIntenso }}>pedido.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Sigue cada paso en vivo hasta que llegue a tus manos.
          </Text>
        </View>
      </View>

      <BuscadorCodigo
        esAncho={esAncho}
        codigoInput={codigoInput}
        errorCodigo={errorCodigo}
        inputRef={inputRef}
        onCambiarCodigo={onCambiarCodigo}
        onBuscar={onBuscar}
      />

      <EstadoUIRenderer
        estado={estadoPedido ?? { tipo: "vacio" }}
        mensajeVacio={
          codigoBuscado
            ? `No encontramos ninguna orden con el código "${codigoBuscado}". Verifica los 4 caracteres de tu confirmación.`
            : "Ingresa tu código de 4 caracteres arriba y presiona 'Rastrear' para ver tu despacho."
        }
        accionVacia={
          codigoBuscado
            ? { etiqueta: "Buscar otro código", onPress: onLimpiarParaOtro }
            : ultimoPedidoCodigo
              ? {
                  etiqueta: `Seguir #${ultimoPedidoCodigo}`,
                  onPress: () => onSeleccionarPedido(ultimoPedidoCodigo),
                }
              : undefined
        }
        onReintentar={onConsultarAhora}
        renderDatos={(pedido) => (
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
              <View style={styles.tarjetaHeader}>
                <View>
                  <Text
                    style={[
                      tipografia.eyebrowMono,
                      { color: colores.tintaTerciaria },
                    ]}
                  >
                    PEDIDO #{pedido.codigo}
                  </Text>
                  <Text style={[tipografia.codigo, { color: colores.tinta }]}>
                    {pedido.items[0]?.nombre ?? `#${pedido.codigo}`}
                  </Text>
                </View>
                <EstadoPedidoBadge estado={pedido.estado} />
              </View>

              {pedido.cancelado ? (
                <View
                  style={[
                    styles.cajaEstado,
                    {
                      backgroundColor: colores.errorSuave,
                      borderColor: colores.error,
                      borderRadius: RADIOS.md,
                    },
                  ]}
                >
                  <View style={styles.pillCancelado}>
                    <Icon name="circle-alert" size={16} color={colores.error} />
                    <Text
                      style={[tipografia.etiqueta, { color: colores.error }]}
                    >
                      Orden cancelada
                    </Text>
                  </View>
                  <Text style={[tipografia.caption, { color: colores.tinta }]}>
                    {pedido.motivoCancelacion ??
                      "La orden fue cancelada y las prendas volvieron al stock de bodega."}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.cajaEstado,
                    {
                      backgroundColor: colores.estadoSuave[pedido.estado],
                      borderColor: colores.borde,
                      borderRadius: RADIOS.md,
                    },
                  ]}
                >
                  <Text style={[tipografia.cuerpo, { color: colores.tinta }]}>
                    {DESCRIPCIONES_ESTADO[pedido.estado]}
                  </Text>
                </View>
              )}

              {pedido.estado === "recibido" && !pedido.cancelado ? (
                <Boton
                  etiqueta="Cancelar pedido"
                  icono="x"
                  variante="secundario"
                  onPress={() => onCancelarPedido(pedido.codigo)}
                  deshabilitado={cancelando}
                  style={styles.botonCancelarPedido}
                  accessibilityLabel="Cancelar pedido"
                  accessibilityHint="Cancela la orden y devuelve las prendas al stock"
                />
              ) : null}

              <StepperProgreso estado={pedido.estado} />

              {pedido.historialEstados && pedido.historialEstados.length > 0 ? (
                <View style={styles.historialEstados}>
                  <Text
                    style={[tipografia.micro, { color: colores.tintaTerciaria }]}
                  >
                    HISTORIAL
                  </Text>
                  <FlatList
                    data={pedido.historialEstados}
                    keyExtractor={(h, idx) => `${h.estado}-${idx}`}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listaGapXs}
                    renderItem={({ item: h }) => (
                      <View style={styles.historialFila}>
                        <Text
                          style={[tipografia.caption, { color: colores.tinta }]}
                        >
                          {etiquetaEstadoHistorial(h.estado)}
                        </Text>
                        <Text
                          style={[
                            tipografia.micro,
                            { color: colores.tintaTerciaria },
                          ]}
                        >
                          {formatearHoraHistorial(h.fecha)}
                        </Text>
                      </View>
                    )}
                  />
                </View>
              ) : null}

              <View
                style={[
                  styles.panelPrendas,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <Text
                  style={[tipografia.micro, { color: colores.tintaTerciaria }]}
                >
                  PRENDAS ({pedido.items.length})
                </Text>
                <FlatList
                  data={pedido.items}
                  keyExtractor={(item, idx) => `${item.nombre}-${idx}`}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listaGapSm}
                  renderItem={({ item }) => (
                    <View style={styles.prendaFila}>
                      <View style={styles.flex}>
                        <Text
                          style={[tipografia.etiqueta, { color: colores.tinta }]}
                        >
                          {item.cantidad}× {item.nombre}
                        </Text>
                        {(item.talla || item.color) && (
                          <Text
                            style={[
                              tipografia.caption,
                              { color: colores.tintaSecundaria },
                            ]}
                          >
                            {[
                              item.talla ? `Talla ${item.talla}` : null,
                              item.color,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                      </View>
                      {item.precioUnitario ? (
                        <Text
                          style={[tipografia.micro, { color: colores.tinta }]}
                        >
                          {formatearCLP(item.precioUnitario * item.cantidad)}
                        </Text>
                      ) : null}
                    </View>
                  )}
                />
                <View
                  style={[
                    styles.subtotalFila,
                    { borderTopColor: colores.borde },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.etiqueta,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Total pagado
                  </Text>
                  <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                    {formatearCLP(pedido.totalEstimado)}
                  </Text>
                </View>
              </View>

              <View style={styles.monitoreoFila}>
                <View
                  style={[
                    styles.pulso,
                    {
                      backgroundColor: esEstadoTerminal(pedido.estado)
                        ? colores.estado.entregado
                        : pollingStatus.enSegundoPlano
                          ? colores.tintaTerciaria
                          : colores.puntoEstado.entregado,
                    },
                  ]}
                />
                <View style={styles.flex}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {esEstadoTerminal(pedido.estado)
                      ? "Pedido entregado"
                      : pollingStatus.enSegundoPlano
                        ? "Monitoreo en pausa"
                        : "Monitoreo activo"}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {esEstadoTerminal(pedido.estado)
                      ? "Entrega completada · polling detenido"
                      : `Cada ${pollingStatus.frecuenciaSegundos}s${pollingStatus.esFrecuenciaLenta ? " · ahorro" : " · en vivo"}${ultimaActualizacion ? ` · ${ultimaActualizacion}` : ""}`}
                  </Text>
                </View>
                <Pressable
                  onPress={onConsultarAhora}
                  accessibilityRole="button"
                  accessibilityLabel="Consultar estado ahora"
                  style={({ pressed }) => [
                    styles.botonRefrescar,
                    {
                      minWidth: puntoMinimo,
                      minHeight: puntoMinimo,
                      borderColor: colores.borde,
                      backgroundColor: colores.superficieHundida,
                      borderRadius: RADIOS.sm,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Icon name="refresh-cw" size={16} color={colores.tinta} />
                </Pressable>
              </View>
            </View>

            <TarjetaDestinoPedido pedido={pedido} esAncho={esAncho} />
          </View>
        )}
      />

      <CatalogoGrid
        titulo="También podría interesarte"
        productos={catalogoRecomendado}
        columnasDesktop={3}
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
  dosColumnas: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.lg,
  },
  unaColumna: { gap: ESPACIOS.lg },
  colMayor: { flex: 1.4, minWidth: 0 },
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  tarjetaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  cajaEstado: { padding: ESPACIOS.md, borderWidth: 1, gap: ESPACIOS.xs + 2 },
  pillCancelado: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.sm },
  botonCancelarPedido: { alignSelf: "flex-start" },
  historialEstados: { gap: ESPACIOS.xs, paddingTop: ESPACIOS.xs },
  listaGapXs: { gap: ESPACIOS.xs },
  listaGapSm: { gap: ESPACIOS.sm },
  historialFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  panelPrendas: { padding: ESPACIOS.md, borderWidth: 1, gap: ESPACIOS.sm },
  prendaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  subtotalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: ESPACIOS.xs,
    paddingTop: ESPACIOS.sm,
  },
  monitoreoFila: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.md },
  pulso: { width: 10, height: 10, borderRadius: 5 },
  botonRefrescar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    cursor: "pointer",
  },
});
