// ─── Portal CLIENTE Atelier Noir ──────────────────────────────────

import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { AvisoFlotante } from "../components/AvisoFlotante";
import { CarritoModal } from "../components/cliente/CarritoModal";
import { MisPedidosList } from "../components/cliente/MisPedidosList";
import { ModalNombreCliente } from "../components/cliente/ModalNombreCliente";
import { ResumenCliente } from "../components/cliente/ResumenCliente";
import { SeguimientoPedido } from "../components/cliente/SeguimientoPedido";
import { useClienteEstado } from "../components/cliente/useClienteEstado";
import { PortalShell } from "../components/PortalShell";
import { BREAKPOINTS, ESPACIOS } from "../theme/tokens";

export function ClienteScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const st = useClienteEstado();

  return (
    <PortalShell
      rolLabel="Mi espacio"
      usuarioIniciales={st.inicialesCliente}
      usuarioNombre={st.nombreCliente}
      usuarioRol="Cliente Noir"
      items={st.navItems}
      vistaActiva={st.vista}
      onCambiarVista={(id) => st.setVista(id as typeof st.vista)}
      onEditarUsuario={st.abrirModalNombre}
      accionExtra={
        st.carrito.length > 0
          ? {
              etiqueta: `Finalizar compra (${st.carrito.length})`,
              icono: "shopping-bag",
              onPress: () => st.setModalCompraAbierto(true),
            }
          : undefined
      }
      busqueda={st.busquedaGlobal}
      onCambiarBusqueda={st.setBusquedaGlobal}
      placeholderBusqueda="Buscar en tu espacio…"
      mostrarSalir={false}
    >
      <AvisoFlotante
        visible={st.aviso !== null}
        tono={st.aviso?.tono ?? "acento"}
        icono="bell"
        titulo={st.aviso?.titulo ?? ""}
        mensaje={st.aviso?.mensaje ?? ""}
        onCerrar={() => st.setAviso(null)}
      />

      <ModalNombreCliente
        visible={st.modalNombreAbierto}
        reducirMovimiento={st.reducirMovimiento}
        nombreInput={st.nombreEditInput}
        errorNombre={st.errorNombreEdit}
        onCambiarNombreInput={(txt) => {
          st.setNombreEditInput(txt);
          if (st.errorNombreEdit) st.setErrorNombreEdit(null);
        }}
        onGuardar={st.guardarNombreCliente}
        onCerrar={() => st.setModalNombreAbierto(false)}
      />

      <CarritoModal
        visible={st.modalCompraAbierto}
        reducirMovimiento={st.reducirMovimiento}
        carrito={st.carrito}
        errorCarrito={st.errorCarrito}
        nombreCompra={st.nombreCompra}
        errorNombreCompra={st.errorNombreCompra}
        dirCompra={st.dirCompra}
        comunaCompra={st.comunaCompra}
        totalCarrito={st.totalCarrito}
        creandoCompra={st.creandoCompra}
        onCerrar={() => st.setModalCompraAbierto(false)}
        onCambiarCantidad={st.cambiarCantidadCarrito}
        onQuitarItem={st.quitarItemCarrito}
        onCambiarNombre={(txt) => {
          st.setNombreCompra(txt);
          if (st.errorNombreCompra) st.setErrorNombreCompra(null);
        }}
        onCambiarDir={st.setDirCompra}
        onCambiarComuna={st.setComunaCompra}
        onConfirmar={() => void st.confirmarPedidoCliente()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenidoScroll,
          esAncho && styles.contenidoScrollAncho,
        ]}
      >
        <View style={styles.contenidoInner}>
          {st.vista === "resumen" ? (
            <ResumenCliente
              esAncho={esAncho}
              primerNombreCliente={st.primerNombreCliente}
              misPedidos={st.misPedidos}
              misPedidosActivosCount={st.misPedidosActivosCount}
              stockTotalUnidades={st.stockTotalUnidades}
              pedidoActivoDestacado={st.pedidoActivoDestacado}
              catalogoDestacado={st.catalogoFiltrado.slice(0, 4)}
              onAbrirModalNombre={st.abrirModalNombre}
              onIrVista={st.setVista}
              onSeleccionarPedido={st.seleccionarPedidoParaSeguir}
              onAgregarAlCarrito={st.agregarAlCarritoCliente}
              tallaSeleccionadaDe={st.tallaSeleccionadaDe}
              onSeleccionarTalla={st.seleccionarTallaProducto}
            />
          ) : st.vista === "mis-pedidos" ? (
            <MisPedidosList
              misPedidosTotal={st.misPedidos.length}
              pedidosFiltrados={st.pedidosFiltrados}
              filtroHistorial={st.filtroHistorial}
              catalogoDestacado={st.catalogoFiltrado.slice(0, 3)}
              onCambiarFiltro={st.setFiltroHistorial}
              onNuevoPedido={() => {
                if (st.carrito.length === 0 && st.catalogo[0]) {
                  st.agregarAlCarritoCliente(st.catalogo[0]);
                } else {
                  st.setModalCompraAbierto(true);
                }
              }}
              onSeleccionarPedido={st.seleccionarPedidoParaSeguir}
              onAgregarAlCarrito={st.agregarAlCarritoCliente}
              tallaSeleccionadaDe={st.tallaSeleccionadaDe}
              onSeleccionarTalla={st.seleccionarTallaProducto}
            />
          ) : (
            <SeguimientoPedido
              esAncho={esAncho}
              codigoInput={st.codigoInput}
              codigoBuscado={st.codigoBuscado}
              errorCodigo={st.errorCodigo}
              estadoPedido={st.estadoPedido}
              ultimoPedidoCodigo={st.misPedidos[0]?.codigo}
              cancelando={st.cancelando}
              ultimaActualizacion={st.ultimaActualizacion}
              pollingStatus={st.pollingStatus}
              catalogoRecomendado={st.catalogoFiltrado.slice(0, 3)}
              inputRef={inputRef}
              onCambiarCodigo={(texto) => {
                st.setCodigoInput(texto);
                if (st.errorCodigo) st.setErrorCodigo(null);
              }}
              onBuscar={st.handleBuscar}
              onLimpiarParaOtro={() => {
                st.setCodigoInput("");
                st.setErrorCodigo(null);
                inputRef.current?.focus();
              }}
              onSeleccionarPedido={st.seleccionarPedidoParaSeguir}
              onConsultarAhora={() => void st.consultarPedido()}
              onCancelarPedido={(cod) => void st.handleCancelarPedido(cod)}
              onAgregarAlCarrito={st.agregarAlCarritoCliente}
              tallaSeleccionadaDe={st.tallaSeleccionadaDe}
              onSeleccionarTalla={st.seleccionarTallaProducto}
            />
          )}
        </View>
      </ScrollView>
    </PortalShell>
  );
}

const styles = StyleSheet.create({
  contenidoScroll: {
    flexGrow: 1,
    padding: ESPACIOS.lg,
    paddingBottom: ESPACIOS.xxl * 2,
  },
  contenidoScrollAncho: { padding: ESPACIOS.xl },
  contenidoInner: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
});
