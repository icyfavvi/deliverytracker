// ─── Portal ADMIN / BODEGA: Atelier Noir (Operaciones) ─────────────

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
  AdminBodegaView,
  AdminDespachosView,
  AdminResumenView,
  AdminSeguimientoView,
} from "../components/AdminSubvistas";
import { AvisoFlotante } from "../components/AvisoFlotante";
import { FormularioRapido } from "../components/local/FormularioRapido";
import { PedidosLocalList } from "../components/local/PedidosLocalList";
import { useLocalEstado, VistaAdmin } from "../components/local/useLocalEstado";
import { PortalShell } from "../components/PortalShell";
import { TarjetaMetrica } from "../components/TarjetaMetrica";
import { BREAKPOINTS, ESPACIOS } from "../theme/tokens";

export function LocalScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const scrollFormRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const st = useLocalEstado();

  const formulario = (
    <FormularioRapido
      nombre={st.nombre}
      direccion={st.direccion}
      comuna={st.comuna}
      items={st.items}
      catalogoRapido={st.catalogoRapido}
      itemNombreManual={st.itemNombreManual}
      tallaManual={st.tallaManual}
      creando={st.creando}
      errorNombre={st.errorNombre}
      errorItems={st.errorItems}
      cantidadPrendas={st.cantidadPrendas}
      totalEstimado={st.totalEstimado}
      onCambiarNombre={(texto) => {
        st.setNombre(texto);
        if (st.errorNombre) st.setErrorNombre(null);
      }}
      onCambiarDireccion={st.setDireccion}
      onCambiarComuna={st.setComuna}
      onCambiarItemManual={st.setItemNombreManual}
      onCambiarTallaManual={st.setTallaManual}
      onAgregarPrenda={st.agregarPrendaCatalogo}
      onAgregarItemManual={st.agregarItemManual}
      onCambiarCantidad={st.cambiarCantidad}
      onEliminarItem={st.eliminarItem}
      onCrearPedido={st.handleCrearPedido}
    />
  );

  const listaSection = (
    <PedidosLocalList
      estadoPedidosFiltrados={st.estadoPedidosFiltrados}
      estadisticas={st.estadisticas}
      esAdmin={st.esAdmin}
      busquedaGlobal={st.busquedaGlobal}
      refrescando={st.refrescando}
      onLimpiarBusqueda={() => st.setBusquedaGlobal("")}
      onIrANuevoPedido={st.irANuevoPedido}
      onDesplazarFormulario={() =>
        scrollFormRef.current?.scrollTo({ y: 0, animated: true })
      }
      onRecargar={() => void st.recargar()}
      onVaciarOrdenes={() => void st.handleVaciarOrdenes()}
      onAvanzarEstado={st.handleAvanzarEstado}
      onCopiarCodigo={st.handleCopiarCodigo}
      onCancelarPedido={st.handleCancelarPedido}
    />
  );

  return (
    <PortalShell
      rolLabel="Operación"
      usuarioIniciales={st.inicialesUsuario}
      usuarioNombre={st.nombreUsuario}
      usuarioRol={st.rolUsuario}
      items={st.navItems}
      vistaActiva={st.vistaActiva}
      onCambiarVista={(id) => st.setVista(id as VistaAdmin)}
      accionExtra={
        st.esAdmin
          ? {
              etiqueta: "Nuevo pedido",
              icono: "plus",
              onPress: st.irANuevoPedido,
            }
          : undefined
      }
      busqueda={st.busquedaGlobal}
      onCambiarBusqueda={st.setBusquedaGlobal}
      placeholderBusqueda="Buscar pedido, cliente o SKU…"
      mostrarSalir
    >
      <AvisoFlotante
        visible={st.aviso !== null}
        tono={st.aviso?.tono ?? "info"}
        icono={st.aviso?.tono === "error" ? "triangle-alert" : "circle-check"}
        titulo={st.aviso?.titulo ?? ""}
        mensaje={st.aviso?.mensaje ?? ""}
        accion={st.aviso?.accion}
        onCerrar={() => st.setAviso(null)}
      />

      <KeyboardAvoidingView
        style={styles.contenedor}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollFormRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.contenidoScroll,
            esAncho && styles.contenidoScrollAncho,
          ]}
        >
          <View style={styles.contenidoInner}>
            {st.vistaActiva === "resumen" ? (
              <AdminResumenView
                nombreAdmin={st.nombreUsuario}
                pedidos={st.pedidos}
                analitica={st.analitica}
                onIrVista={(v) => st.setVista(v)}
                onNuevoPedido={st.irANuevoPedido}
                onAvanzar={st.handleAvanzarEstado}
              />
            ) : st.vistaActiva === "bodega" ? (
              <AdminBodegaView
                analitica={st.analitica}
                busqueda={st.busquedaGlobal}
                onReponer={st.handleReponerStock}
              />
            ) : st.vistaActiva === "despachos" ? (
              <AdminDespachosView
                pedidos={st.pedidos}
                analitica={st.analitica}
                onNuevoPedido={st.irANuevoPedido}
                onAvanzar={st.handleAvanzarEstado}
              />
            ) : st.vistaActiva === "seguimiento" ? (
              <AdminSeguimientoView
                pedidos={st.pedidos}
                analitica={st.analitica}
                onRefrescar={() => void st.recargar()}
                onAvanzar={st.handleAvanzarEstado}
              />
            ) : (
              <View style={styles.pedidosWrap}>
                <View style={styles.metricasGrid}>
                  <TarjetaMetrica
                    etiqueta="Órdenes"
                    valor={st.estadisticas.total}
                    subtitulo="Registradas en turno"
                    icono="package"
                    tono="acento"
                  />
                  <TarjetaMetrica
                    etiqueta="En curso"
                    valor={st.estadisticas.activos}
                    subtitulo="Pendientes de entrega"
                    icono="truck"
                    tono="advertencia"
                  />
                  <TarjetaMetrica
                    etiqueta="Entregadas"
                    valor={st.estadisticas.entregados}
                    subtitulo="Completadas"
                    icono="circle-check"
                    tono="exito"
                  />
                </View>

                {esAncho ? (
                  <View style={styles.columnasAncho}>
                    <View style={styles.columnaFormulario}>{formulario}</View>
                    <View style={styles.columnaLista}>{listaSection}</View>
                  </View>
                ) : (
                  <View style={styles.pedidosMovilStack}>
                    {formulario}
                    {listaSection}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PortalShell>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
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
  pedidosWrap: { gap: ESPACIOS.lg },
  pedidosMovilStack: { gap: ESPACIOS.lg },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  columnasAncho: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.lg,
  },
  columnaFormulario: { flex: 1, maxWidth: 460 },
  columnaLista: { flex: 1.15, minWidth: 320 },
});
