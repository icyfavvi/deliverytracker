// ─── Pantalla ADMIN: Crear pedido (Operaciones) ──────────────────

import React, { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AvisoFlotante } from "../components/AvisoFlotante";
import {
  BarraInferiorCrearPedido,
  CabeceraCrearPedido,
} from "../components/crear-pedido/CabeceraCrearPedido";
import { FormDespacho } from "../components/crear-pedido/FormDespacho";
import {
  ModalConfirmacionPedido,
  PedidoCreadoExito,
} from "../components/crear-pedido/PedidoCreadoExito";
import { ResumenPedido } from "../components/crear-pedido/ResumenPedido";
import { SelectorCliente } from "../components/crear-pedido/SelectorCliente";
import { SelectorProducto } from "../components/crear-pedido/SelectorProducto";
import { useCrearPedidoEstado } from "../components/crear-pedido/useCrearPedidoEstado";
import { useTema } from "../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS } from "../theme/tokens";

export function CrearPedidoScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores } = useTema();
  const scrollPrincipalRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const st = useCrearPedidoEstado();

  const handleIntentarConfirmar = () => {
    st.intentarConfirmar(() => {
      scrollPrincipalRef.current?.scrollTo({
        y: 0,
        animated: !st.reducirMovimiento,
      });
    });
  };

  if (st.pedidoCreado) {
    return (
      <PedidoCreadoExito
        pedidoCreado={st.pedidoCreado}
        esAncho={esAncho}
        onCrearOtro={st.reiniciarParaOtroPedido}
      />
    );
  }

  const bloqueResumen = (
    <ResumenPedido
      lineasPedido={st.lineasPedido}
      catalogo={st.catalogo}
      stockActualPorSku={st.stockActualPorSku}
      conflictosStock={st.conflictosStock}
      errorProductos={st.errores.productos}
      desglose={st.desglose}
      metodoPago={st.metodoPago}
      umbralTexto={st.umbralTexto}
      umbralConfirmacion={st.umbralConfirmacion}
      enviando={st.enviando}
      onAjustarLineaAMaximo={st.ajustarLineaAMaximo}
      onQuitarLinea={st.cambiarCantidadSku}
      onCambiarMetodoPago={st.setMetodoPago}
      onCambiarUmbralTexto={st.setUmbralTexto}
      onConfirmar={handleIntentarConfirmar}
    />
  );

  const formularioBloques = (
    <View style={styles.bloquesColumna}>
      <SelectorCliente
        busquedaCliente={st.busquedaCliente}
        clientesFiltrados={st.clientesFiltrados}
        clienteSeleccionado={st.clienteSeleccionado}
        mostrarNuevoCliente={st.mostrarNuevoCliente}
        errorCliente={st.errores.cliente}
        nuevoCliNombre={st.nuevoCliNombre}
        nuevoCliCorreo={st.nuevoCliCorreo}
        nuevoCliTelefono={st.nuevoCliTelefono}
        erroresNuevoCli={st.erroresNuevoCli}
        onCambiarBusqueda={st.setBusquedaCliente}
        onToggleNuevoCliente={() => st.setMostrarNuevoCliente((v) => !v)}
        onSeleccionarCliente={st.seleccionarCliente}
        onCambiarClienteSeleccionado={() => st.setClienteSeleccionado(null)}
        onIniciarNuevoConBusqueda={() => {
          st.setNuevoCliNombre(st.busquedaCliente.trim());
          st.setMostrarNuevoCliente(true);
        }}
        onCambiarNuevoNombre={(v) => {
          st.setNuevoCliNombre(v);
          st.setErroresNuevoCli((p) => ({ ...p, nombre: undefined }));
        }}
        onCambiarNuevoCorreo={(v) => {
          st.setNuevoCliCorreo(v);
          st.setErroresNuevoCli((p) => ({ ...p, correo: undefined }));
        }}
        onCambiarNuevoTelefono={(v) => {
          st.setNuevoCliTelefono(v);
          st.setErroresNuevoCli((p) => ({ ...p, telefono: undefined }));
        }}
        onGuardarNuevoCliente={st.guardarNuevoCliente}
      />

      <SelectorProducto
        totalCatalogo={st.catalogo.length}
        productosFiltrados={st.productosFiltrados}
        busquedaProducto={st.busquedaProducto}
        filtroStockCritico={st.filtroStockCritico}
        lineasPedido={st.lineasPedido}
        mensajeStockLive={st.mensajeStockLive}
        errorProductos={st.errores.productos}
        varianteActivaDe={st.varianteActivaDe}
        onCambiarBusqueda={st.setBusquedaProducto}
        onCambiarFiltroCritico={st.setFiltroStockCritico}
        onLimpiarFiltros={() => {
          st.setBusquedaProducto("");
          st.setFiltroStockCritico(false);
        }}
        onSimularBajaStock={st.handleSimularBajaStock}
        onSeleccionarTalla={(productoId, talla) =>
          st.setTallaPorProducto((prev) => ({ ...prev, [productoId]: talla }))
        }
        onCambiarCantidadSku={st.cambiarCantidadSku}
      />

      <FormDespacho
        direccion={st.direccion}
        comuna={st.comuna}
        transportista={st.transportista}
        ventanaHoraria={st.ventanaHoraria}
        notaInterna={st.notaInterna}
        errorDireccion={st.errores.direccion}
        errorComuna={st.errores.comuna}
        onCambiarDireccion={(txt) => {
          st.setDireccion(txt);
          st.setErrores((prev) => ({ ...prev, direccion: undefined }));
        }}
        onCambiarComuna={(txt) => {
          st.setComuna(txt);
          st.setErrores((prev) => ({ ...prev, comuna: undefined }));
        }}
        onCambiarTransportista={st.setTransportista}
        onCambiarVentana={st.setVentanaHoraria}
        onCambiarNota={st.setNotaInterna}
      />

      {!esAncho ? bloqueResumen : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <AvisoFlotante
        visible={st.aviso !== null}
        tono={st.aviso?.tono ?? "info"}
        icono={st.aviso?.tono === "error" ? "triangle-alert" : "circle-check"}
        titulo={st.aviso?.titulo ?? ""}
        mensaje={st.aviso?.mensaje ?? ""}
        onCerrar={() => st.setAviso(null)}
      />

      <ModalConfirmacionPedido
        modalConfirmacion={st.modalConfirmacion}
        reducirMovimiento={st.reducirMovimiento}
        clienteNombre={st.clienteSeleccionado?.nombre}
        total={st.desglose.total}
        umbralConfirmacion={st.umbralConfirmacion}
        onCancelar={() => st.setModalConfirmacion(null)}
        onConfirmar={() => void st.ejecutarEnvioPedido()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <CabeceraCrearPedido />

        {esAncho ? (
          <View style={styles.layoutDesktop}>
            <ScrollView
              ref={scrollPrincipalRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollDesktopIzq}
            >
              {formularioBloques}
            </ScrollView>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollDesktopDer}
            >
              {bloqueResumen}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.flex}>
            <ScrollView
              ref={scrollPrincipalRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.scrollMovil,
                { paddingBottom: st.tecladoVisible ? 40 : 120 },
              ]}
            >
              {formularioBloques}
            </ScrollView>

            {!st.tecladoVisible ? (
              <BarraInferiorCrearPedido
                bottomInset={insets.bottom}
                cantidadItems={st.lineasPedido.length}
                total={st.desglose.total}
                enviando={st.enviando}
                onConfirmar={handleIntentarConfirmar}
              />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  layoutDesktop: {
    flex: 1,
    flexDirection: "row",
    maxWidth: 1220,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.lg,
    gap: ESPACIOS.lg,
  },
  scrollDesktopIzq: { flexGrow: 1, paddingBottom: ESPACIOS.xxl * 2, minWidth: 460 },
  scrollDesktopDer: { width: 390, paddingBottom: ESPACIOS.xxl * 2 },
  scrollMovil: { padding: ESPACIOS.lg },
  bloquesColumna: { gap: ESPACIOS.lg },
});
