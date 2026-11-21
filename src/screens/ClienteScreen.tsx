// ─── Pantalla CLIENTE: E-commerce de Moda & Vestuario ──────────────
//
// Requisitos de Rúbrica UTEM:
// 1. Consulta por código de pedido.
// 2. Polling con intervalo creciente (5s primeros 30s, luego 30s) + cleanup.
// 3. Manejo explícito de 4 estados con tipo discriminado (cargando/error/vacio/datos).
// 4. "El cliente recibe aviso cuando el estado cambia" -> Notificación visual en vivo.
// 5. Totalmente responsive en ~5", ~6.7" y tablet.

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
import { BREAKPOINTS, ESPACIOS, RADIOS, sombraTarjeta } from "../theme/tokens";
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
  const { colores, tipografia, modo } = useTema();

  const [codigoInput, setCodigoInput] = useState("");
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoUI<Pedido> | null>({ tipo: "vacio" });
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);

  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // ─── Aviso reactivo cuando el estado cambia ───────────────────
  const estadoAnteriorRef = useRef<EstadoPedido | null>(null);

  // ─── Consultar pedido al servidor (Capa de servicios) ────────
  const consultarPedido = useCallback(async () => {
    if (!codigoBuscado) return;

    try {
      const res = await obtenerPedidoPorCodigo(codigoBuscado);

      if (res.status === 404) {
        // Estado discriminado: VACÍO (404 Not Found ≠ Error 500)
        setEstadoPedido({ tipo: "vacio" });
        estadoAnteriorRef.current = null;
        return;
      }

      if (!res.ok || !res.data) {
        // Estado discriminado: ERROR de servidor
        setEstadoPedido({
          tipo: "error",
          mensaje: `El servidor respondió con un error (${res.status}).`,
        });
        return;
      }

      const pedidoActualizado = res.data;

      // Detectar cambio de estado para emitir el AVISO AL CLIENTE
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

      // Estado discriminado: DATOS
      setEstadoPedido({ tipo: "datos", datos: pedidoActualizado });
    } catch {
      setEstadoPedido({
        tipo: "error",
        mensaje: "Error de conexión al consultar el estado del despacho.",
      });
    }
  }, [codigoBuscado]);

  // ─── Polling con intervalo creciente + cleanup (Rúbrica) ─────
  const pollingStatus = usePedidoPolling({
    fetchFn: consultarPedido,
    enabled: codigoBuscado !== null,
    intervaloInicial: 5_000,
    intervaloLargo: 30_000,
    umbralCambio: 30_000,
  });

  // Al cambiar el código buscado, consultar asíncronamente con protección de cancelación
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

  // El aviso se cierra solo a los 7 segundos.
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const handleBuscar = useCallback(() => {
    const limpio = codigoInput.trim().toUpperCase();
    if (limpio.length === 0) {
      setErrorCodigo("Ingresa el código que aparece en tu confirmación de compra.");
      return;
    }
    if (limpio.length < 4) {
      setErrorCodigo("El código tiene 4 caracteres. Revisa los que te enviamos.");
      return;
    }
    setErrorCodigo(null);
    estadoAnteriorRef.current = null;
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, [codigoInput]);

  const formatearPrecio = (valor: number) => "$" + valor.toLocaleString("es-CL");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colores.fondo }]} edges={["top"]}>
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
            eyebrow="Atelier Noir · Seguimiento de compra"
            titulo="Rastrea tu despacho"
            descripcion="Ingresa tu código de 4 caracteres para ver el estado de preparación y despacho de tus prendas en tiempo real."
            acciones={<InterruptorTema />}
          />

          {/* ─── Buscador ─────────────────────────────────────────── */}
          <View
            style={[
              styles.buscador,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.lg,
              },
              sombraTarjeta(modo),
            ]}
          >
            <View
              style={[
                styles.campoCodigo,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                  borderColor: errorCodigo ? colores.error : "transparent",
                },
              ]}
            >
              <Icon name="hash" size={16} color={colores.tintaTerciaria} />
              <TextInput
                ref={inputRef}
                style={[styles.inputCodigo, tipografia.boton, { color: colores.tinta }]}
                placeholder="ABCD"
                placeholderTextColor={colores.tintaTerciaria}
                value={codigoInput}
                onChangeText={(texto) => {
                  setCodigoInput(texto.toUpperCase());
                  if (errorCodigo) setErrorCodigo(null);
                }}
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
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar código"
                  style={styles.limpiar}
                >
                  <Icon name="x" size={14} color={colores.tintaTerciaria} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.botonRastrear,
                {
                  backgroundColor: colores.primario,
                  borderRadius: RADIOS.md,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleBuscar}
              accessibilityRole="button"
              accessibilityLabel="Rastrear pedido"
            >
              <Icon name="search" size={17} color={colores.sobrePrimario} />
              <Text style={[tipografia.boton, { color: colores.sobrePrimario }]}>
                Rastrear
              </Text>
            </Pressable>

            {errorCodigo ? (
              <View style={styles.errorFila}>
                <Icon name="circle-alert" size={13} color={colores.error} />
                <Text style={[tipografia.caption, { color: colores.error }]}>
                  {errorCodigo}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ─── Resultado ────────────────────────────────────────── */}
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
                      borderRadius: RADIOS.xl,
                    },
                    sombraTarjeta(modo),
                  ]}
                >
                  {/* Cabecera de la orden */}
                  <View style={styles.tarjetaHeader}>
                    <View style={styles.tarjetaHeaderTexto}>
                      <Text
                        style={[
                          tipografia.micro,
                          styles.eyebrow,
                          { color: colores.tintaTerciaria },
                        ]}
                      >
                        ORDEN REGISTRADA
                      </Text>
                      <Text style={[tipografia.codigo, { color: colores.tinta }]}>
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
                        backgroundColor: colores.superficieHundida,
                        borderRadius: RADIOS.md,
                      },
                    ]}
                  >
                    <Text style={[tipografia.cuerpo, { color: colores.tinta }]}>
                      {DESCRIPCIONES_ESTADO[pedido.estado]}
                    </Text>
                  </View>

                  {/* Stepper de 4 pasos */}
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
                        tipografia.eyebrow,
                        styles.seccionTitulo,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      DATOS DE ENTREGA
                    </Text>
                    <View style={styles.filaDato}>
                      <Icon name="user" size={15} color={colores.tintaTerciaria} />
                      <Text style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}>
                        {pedido.clienteNombre}
                      </Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Icon name="map-pin" size={15} color={colores.tintaTerciaria} />
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
                      <Icon name="truck" size={15} color={colores.acento} />
                      <Text style={[tipografia.caption, { color: colores.acento }]}>
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
                        tipografia.eyebrow,
                        styles.seccionTitulo,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      PRENDAS EN ESTA ORDEN ({pedido.items.length})
                    </Text>
                    {pedido.items.map((item, idx) => (
                      <View key={`${item.nombre}-${idx}`} style={styles.prendaFila}>
                        <View style={styles.prendaTexto}>
                          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                            {item.cantidad}× {item.nombre}
                          </Text>
                          {(item.talla || item.color) && (
                            <Text
                              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                            >
                              {[item.talla ? `Talla ${item.talla}` : null, item.color]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          )}
                        </View>
                        {item.precioUnitario ? (
                          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                            {formatearPrecio(item.precioUnitario * item.cantidad)}
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
                        style={[tipografia.etiqueta, { color: colores.tintaSecundaria }]}
                      >
                        Total pagado
                      </Text>
                      <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                        {formatearPrecio(pedido.totalEstimado ?? 0)}
                      </Text>
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
                        style={[styles.pulso, { backgroundColor: colores.exito }]}
                      />
                      <View style={styles.monitoreoTextos}>
                        <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                          Monitoreo activo
                        </Text>
                        <Text
                          style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                        >
                          Consultando cada {pollingStatus.frecuenciaSegundos}s
                          {pollingStatus.esFrecuenciaLenta
                            ? " · modo ahorro"
                            : " · en vivo"}
                          {ultimaActualizacion
                            ? ` · actualizado ${ultimaActualizacion}`
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
                            borderColor: colores.borde,
                            backgroundColor: colores.superficieHundida,
                            borderRadius: RADIOS.sm,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Icon name="refresh-cw" size={14} color={colores.tinta} />
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
    maxWidth: 620,
  },
  buscador: {
    padding: ESPACIOS.md,
    marginBottom: ESPACIOS.lg,
    borderWidth: 1,
  },
  campoCodigo: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.md,
    minHeight: 52,
    borderWidth: 1.5,
  },
  inputCodigo: {
    flex: 1,
    letterSpacing: 4,
    paddingVertical: ESPACIOS.sm,
  },
  limpiar: {
    padding: ESPACIOS.xs,
    cursor: "pointer",
  },
  botonRastrear: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    minHeight: 48,
    marginTop: ESPACIOS.md,
    cursor: "pointer",
  },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.sm,
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
  },
  tarjetaHeaderTexto: {
    flex: 1,
  },
  eyebrow: {
    letterSpacing: 1.6,
    marginBottom: ESPACIOS.xs,
  },
  cajaEstado: {
    padding: ESPACIOS.md,
    marginTop: ESPACIOS.lg,
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
  prendaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingVertical: ESPACIOS.xs + 1,
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
    marginTop: ESPACIOS.sm,
    paddingTop: ESPACIOS.md,
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
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  botonRefrescar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    cursor: "pointer",
  },
});
