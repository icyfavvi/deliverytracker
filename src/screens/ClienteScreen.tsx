// ─── Pantalla CLIENTE: Seguimiento de Despacho ─────────────────────
//
// Rediseño visual Atelier Noir (ink #0a0d10 + azul cobalto #3e6ff6),
// conservando intactos el polling adaptativo, los 4 estados de UI
// discriminados, las notificaciones de cambio de estado y la
// accesibilidad WCAG AA (>= 44pt, >= 12px, contraste >= 4.5:1).

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvisoFlotante, TonoAviso } from "../components/AvisoFlotante";
import { EstadoPedidoBadge } from "../components/EstadoPedidoBadge";
import { EstadoUIRenderer } from "../components/EstadoUIRenderer";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { Masthead } from "../components/Masthead";
import { StepperProgreso } from "../components/StepperProgreso";
import { usePedidoPolling } from "../hooks/usePedidoPolling";
import { obtenerPedidoPorCodigo } from "../services/pedidosApi";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";
import {
  DESCRIPCIONES_ESTADO,
  EstadoPedido,
  EstadoUI,
  Pedido,
} from "../types/pedido";

const DURACION_AVISO_MS = 7_000;

interface AvisoEstado {
  titulo: string;
  mensaje: string;
  tono: TonoAviso;
}

export function ClienteScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  const [codigoInput, setCodigoInput] = useState("");
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoUI<Pedido> | null>({
    tipo: "vacio",
  });
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(
    null
  );
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);
  const [campoEnfocado, setCampoEnfocado] = useState(false);

  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // ─── Aviso reactivo cuando el estado cambia ───────────────────
  const estadoAnteriorRef = useRef<EstadoPedido | null>(null);

  // ─── Consultar pedido al servidor (Capa de servicios) ────────
  const consultarPedido = useCallback(async () => {
    if (!codigoBuscado) return;

    try {
      const res = await obtenerPedidoPorCodigo(codigoBuscado);

      if (res.status === 404) {
        setEstadoPedido({ tipo: "vacio" });
        estadoAnteriorRef.current = null;
        return;
      }

      if (!res.ok || !res.data) {
        setEstadoPedido({
          tipo: "error",
          mensaje: `El servidor respondió con un error (${res.status}).`,
        });
        return;
      }

      const pedidoActualizado = res.data;

      if (
        estadoAnteriorRef.current !== null &&
        estadoAnteriorRef.current !== pedidoActualizado.estado
      ) {
        setAviso({
          titulo: "Tu pedido cambió de estado",
          mensaje: DESCRIPCIONES_ESTADO[pedidoActualizado.estado],
          tono: "acento",
        });
      }
      estadoAnteriorRef.current = pedidoActualizado.estado;
      setUltimaActualizacion(
        new Date().toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setEstadoPedido({ tipo: "datos", datos: pedidoActualizado });
    } catch {
      setEstadoPedido({
        tipo: "error",
        mensaje: "Error de conexión al consultar el estado del despacho.",
      });
    }
  }, [codigoBuscado]);

  // ─── Polling con intervalo creciente + cleanup ───────────────
  const pollingStatus = usePedidoPolling({
    fetchFn: consultarPedido,
    enabled: codigoBuscado !== null,
    intervaloInicial: 5_000,
    intervaloLargo: 30_000,
    umbralCambio: 30_000,
  });

  useEffect(() => {
    if (!codigoBuscado) return;
    let cancelado = false;
    (async () => {
      try {
        const res = await obtenerPedidoPorCodigo(codigoBuscado);
        if (cancelado) return;
        if (res.status === 404) {
          setEstadoPedido({ tipo: "vacio" });
          estadoAnteriorRef.current = null;
          return;
        }
        if (!res.ok || !res.data) {
          setEstadoPedido({
            tipo: "error",
            mensaje: `El servidor respondió con un error (${res.status}).`,
          });
          return;
        }
        setEstadoPedido({ tipo: "datos", datos: res.data });
        setUltimaActualizacion(
          new Date().toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch {
        if (!cancelado) {
          setEstadoPedido({
            tipo: "error",
            mensaje: "Error de conexión al consultar el estado del despacho.",
          });
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [codigoBuscado]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const handleBuscar = useCallback(() => {
    const limpio = codigoInput.trim().toUpperCase();
    if (limpio.length === 0) {
      setErrorCodigo(
        "Ingresa el código que aparece en tu confirmación de compra."
      );
      return;
    }
    if (limpio.length < 4) {
      setErrorCodigo(
        "El código tiene 4 caracteres. Revisa los que te enviamos."
      );
      return;
    }
    setErrorCodigo(null);
    estadoAnteriorRef.current = null;
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, [codigoInput]);

  const formatearPrecio = (valor: number) => "$" + valor.toLocaleString("es-CL");

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <AvisoFlotante
        visible={aviso !== null}
        tono={aviso?.tono ?? "acento"}
        icono="bell"
        titulo={aviso?.titulo ?? ""}
        mensaje={aviso?.mensaje ?? ""}
        onCerrar={() => setAviso(null)}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, esAncho && styles.scrollAncho]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contenedor}>
          <Masthead
            eyebrow="Atelier Noir · Seguimiento"
            titulo="Rastrea tu despacho"
            variante="tecnico"
            descripcion="Consulta en vivo el estado de preparación y entrega de tus prendas."
            acciones={<InterruptorTema />}
          />

          {/* ─── Hero + Buscador (referencia .client-hero) ──────── */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colores.panelOscuro,
                borderColor: colores.panelOscuroBorde,
                borderRadius: RADIOS.lg,
              },
              sombraTarjeta(modo),
            ]}
          >
            {/* Acentos geométricos concéntricos */}
            <View pointerEvents="none" style={styles.aroExterno} />
            <View pointerEvents="none" style={styles.aroInterno} />

            <View style={styles.heroEncabezado}>
              <View style={styles.heroPill}>
                <Icon name="package-search" size={14} color="#86a6ff" />
                <Text style={[tipografia.micro, styles.heroPillTexto]}>
                  CÓDIGO DE ORDEN
                </Text>
              </View>
              <Text style={[tipografia.subtitulo, styles.heroTitulo]}>
                Ingresa tu código de 4 caracteres
              </Text>
              <Text style={[tipografia.caption, styles.heroBajada]}>
                Actualización automática sin recargar la pantalla.
              </Text>
            </View>

            <View
              style={[
                styles.buscadorCaja,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <View style={esAncho ? styles.buscadorFilaAncha : styles.buscadorColumna}>
                <View
                  style={[
                    styles.campoCodigo,
                    {
                      backgroundColor: campoEnfocado
                        ? colores.superficie
                        : colores.superficieHundida,
                      borderRadius: RADIOS.sm,
                      borderColor: errorCodigo
                        ? colores.error
                        : campoEnfocado
                          ? colores.acento
                          : colores.borde,
                      minHeight: Math.max(puntoMinimo, 50),
                    },
                  ]}
                >
                  <Icon
                    name="hash"
                    size={17}
                    color={
                      campoEnfocado
                        ? colores.acentoIntenso
                        : colores.tintaTerciaria
                    }
                  />
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.inputCodigo,
                      tipografia.codigo,
                      { color: colores.tinta, fontSize: 18 },
                    ]}
                    placeholder="ABCD"
                    placeholderTextColor={colores.tintaTerciaria}
                    value={codigoInput}
                    onChangeText={(texto) => {
                      setCodigoInput(texto.toUpperCase());
                      if (errorCodigo) setErrorCodigo(null);
                    }}
                    onFocus={() => setCampoEnfocado(true)}
                    onBlur={() => setCampoEnfocado(false)}
                    maxLength={4}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleBuscar}
                    accessibilityLabel="Código de seguimiento de tu orden"
                  />
                  {codigoInput.length > 0 ? (
                    <Pressable
                      onPress={() => setCodigoInput("")}
                      accessibilityRole="button"
                      accessibilityLabel="Limpiar código"
                      style={({ pressed }) => [
                        styles.limpiar,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Icon
                        name="x"
                        size={16}
                        color={colores.tintaSecundaria}
                      />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.botonRastrear,
                    esAncho && styles.botonRastrearAncho,
                    {
                      backgroundColor: colores.primario,
                      borderRadius: RADIOS.sm,
                      minHeight: Math.max(puntoMinimo, 50),
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={handleBuscar}
                  accessibilityRole="button"
                  accessibilityLabel="Rastrear pedido"
                >
                  <Icon
                    name="search"
                    size={17}
                    color={colores.sobrePrimario}
                  />
                  <Text
                    style={[tipografia.boton, { color: colores.sobrePrimario }]}
                  >
                    Rastrear
                  </Text>
                </Pressable>
              </View>

              {errorCodigo ? (
                <View style={styles.errorFila}>
                  <Icon name="circle-alert" size={14} color={colores.error} />
                  <Text
                    accessibilityRole="alert"
                    style={[
                      tipografia.caption,
                      { color: colores.error, flex: 1 },
                    ]}
                  >
                    {errorCodigo}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ─── Resultado ──────────────────────────────────────── */}
          <View style={styles.resultado}>
            <EstadoUIRenderer
              estado={estadoPedido ?? { tipo: "vacio" }}
              mensajeVacio={
                codigoBuscado
                  ? `No encontramos ninguna orden con el código "${codigoBuscado}". Revisa que los 4 caracteres coincidan con tu confirmación de compra.`
                  : "Ingresa tu código de 4 caracteres arriba y presiona 'Rastrear' para consultar el estado de tu pedido."
              }
              accionVacia={
                codigoBuscado
                  ? {
                      etiqueta: "Buscar otro código",
                      onPress: () => {
                        setCodigoInput("");
                        setErrorCodigo(null);
                        inputRef.current?.focus();
                      },
                    }
                  : undefined
              }
              onReintentar={consultarPedido}
              renderDatos={(pedido) => (
                <View
                  style={[
                    styles.tarjeta,
                    {
                      backgroundColor: colores.superficie,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.lg,
                    },
                    sombraTarjeta(modo),
                  ]}
                >
                  {/* Cabecera de la orden */}
                  <View style={styles.tarjetaHeader}>
                    <View style={styles.tarjetaHeaderTexto}>
                      <Text
                        style={[
                          tipografia.eyebrowMono,
                          styles.eyebrow,
                          { color: colores.tintaTerciaria },
                        ]}
                      >
                        ORDEN REGISTRADA
                      </Text>
                      <Text
                        style={[tipografia.codigo, { color: colores.tinta }]}
                      >
                        #{pedido.codigo}
                      </Text>
                    </View>
                    <EstadoPedidoBadge estado={pedido.estado} />
                  </View>

                  {/* Descripción del estado actual */}
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

                  {/* Timeline de 4 pasos */}
                  <View style={styles.seccion}>
                    <StepperProgreso estado={pedido.estado} />
                  </View>

                  {/* Datos de entrega */}
                  <View
                    style={[
                      styles.seccion,
                      styles.bloqueSeparado,
                      { borderTopColor: colores.borde },
                    ]}
                  >
                    <Text
                      style={[
                        tipografia.eyebrowMono,
                        styles.seccionTitulo,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      DATOS DE ENTREGA
                    </Text>
                    <View style={styles.filaDato}>
                      <Icon
                        name="user"
                        size={15}
                        color={colores.tintaTerciaria}
                      />
                      <Text
                        style={[
                          tipografia.cuerpoFuerte,
                          { color: colores.tinta, flex: 1 },
                        ]}
                      >
                        {pedido.clienteNombre}
                      </Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Icon
                        name="map-pin"
                        size={15}
                        color={colores.tintaTerciaria}
                      />
                      <Text
                        style={[
                          tipografia.caption,
                          styles.filaDatoTexto,
                          { color: colores.tintaSecundaria },
                        ]}
                      >
                        {pedido.direccionDespacho}, {pedido.comuna}
                      </Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Icon
                        name="truck"
                        size={15}
                        color={colores.acentoIntenso}
                      />
                      <Text
                        style={[
                          tipografia.caption,
                          {
                            color: colores.acentoIntenso,
                            fontFamily: FUENTES.semi,
                          },
                        ]}
                      >
                        {pedido.metodoEnvio}
                      </Text>
                    </View>
                  </View>

                  {/* Prendas */}
                  <View
                    style={[
                      styles.seccion,
                      styles.bloqueSeparado,
                      { borderTopColor: colores.borde },
                    ]}
                  >
                    <Text
                      style={[
                        tipografia.eyebrowMono,
                        styles.seccionTitulo,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      PRENDAS EN ESTA ORDEN ({pedido.items.length})
                    </Text>
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
                      {pedido.items.map((item, idx) => (
                        <View
                          key={`${item.nombre}-${idx}`}
                          style={styles.prendaFila}
                        >
                          <View style={styles.prendaTexto}>
                            <Text
                              style={[
                                tipografia.etiqueta,
                                { color: colores.tinta },
                              ]}
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
                              style={[
                                tipografia.micro,
                                { color: colores.tinta },
                              ]}
                            >
                              {formatearPrecio(
                                item.precioUnitario * item.cantidad
                              )}
                            </Text>
                          ) : null}
                        </View>
                      ))}

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
                        <Text
                          style={[
                            tipografia.subtitulo,
                            { color: colores.tinta },
                          ]}
                        >
                          {formatearPrecio(pedido.totalEstimado ?? 0)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Monitoreo en vivo */}
                  <View
                    style={[
                      styles.seccion,
                      styles.bloqueSeparado,
                      { borderTopColor: colores.borde },
                    ]}
                  >
                    <View style={styles.monitoreoFila}>
                      <View
                        style={[
                          styles.pulso,
                          { backgroundColor: colores.puntoEstado.entregado },
                        ]}
                      />
                      <View style={styles.monitoreoTextos}>
                        <Text
                          style={[
                            tipografia.etiqueta,
                            { color: colores.tinta },
                          ]}
                        >
                          Monitoreo activo
                        </Text>
                        <Text
                          style={[
                            tipografia.caption,
                            { color: colores.tintaSecundaria },
                          ]}
                        >
                          Cada {pollingStatus.frecuenciaSegundos}s
                          {pollingStatus.esFrecuenciaLenta
                            ? " · ahorro"
                            : " · en vivo"}
                          {ultimaActualizacion
                            ? ` · ${ultimaActualizacion}`
                            : ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={consultarPedido}
                        accessibilityRole="button"
                        accessibilityLabel="Consultar el estado ahora"
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
                        <Icon
                          name="refresh-cw"
                          size={16}
                          color={colores.tinta}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: ESPACIOS.lg,
    paddingBottom: ESPACIOS.xxl * 2,
  },
  scrollAncho: {
    paddingHorizontal: ESPACIOS.xxl,
    alignItems: "center",
  },
  contenedor: {
    width: "100%",
    maxWidth: 660,
  },
  heroCard: {
    padding: ESPACIOS.lg,
    marginBottom: ESPACIOS.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  aroExterno: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.22)",
  },
  aroInterno: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "rgba(80, 200, 232, 0.18)",
  },
  heroEncabezado: {
    marginBottom: ESPACIOS.md,
    gap: ESPACIOS.xs,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ESPACIOS.xs + 2,
    backgroundColor: "rgba(62, 111, 246, 0.16)",
    borderRadius: RADIOS.pill,
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
    marginBottom: ESPACIOS.xs,
  },
  heroPillTexto: {
    color: "#9ab5ff",
  },
  heroTitulo: {
    color: "#ffffff",
  },
  heroBajada: {
    color: "#b8c2ce",
  },
  buscadorCaja: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  buscadorColumna: {
    gap: ESPACIOS.sm,
  },
  buscadorFilaAncha: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.sm,
  },
  campoCodigo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingLeft: ESPACIOS.md,
    paddingRight: ESPACIOS.xs,
    borderWidth: 1.5,
  },
  inputCodigo: {
    flex: 1,
    minWidth: 0,
    letterSpacing: 3,
    paddingVertical: ESPACIOS.sm,
  },
  limpiar: {
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  botonRastrear: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.xl,
    cursor: "pointer",
  },
  botonRastrearAncho: {
    minWidth: 148,
  },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.xs,
  },
  resultado: {
    width: "100%",
  },
  tarjeta: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
  },
  tarjetaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: ESPACIOS.sm,
    flexWrap: "wrap",
  },
  tarjetaHeaderTexto: {
    flex: 1,
    minWidth: 140,
  },
  eyebrow: {
    marginBottom: ESPACIOS.xs,
  },
  cajaEstado: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    marginTop: ESPACIOS.md,
  },
  seccion: {
    marginTop: ESPACIOS.xl,
  },
  bloqueSeparado: {
    borderTopWidth: 1,
    paddingTop: ESPACIOS.lg,
  },
  seccionTitulo: {
    marginBottom: ESPACIOS.md,
  },
  filaDato: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.sm,
    marginBottom: ESPACIOS.sm,
  },
  filaDatoTexto: {
    flex: 1,
    minWidth: 0,
  },
  panelPrendas: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  prendaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  prendaTexto: {
    flex: 1,
    minWidth: 0,
  },
  subtotalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: ESPACIOS.xs,
    paddingTop: ESPACIOS.sm,
  },
  monitoreoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.md,
  },
  monitoreoTextos: {
    flex: 1,
  },
  pulso: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  botonRefrescar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    cursor: "pointer",
  },
});
