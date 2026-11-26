// ─── Lista de Pedidos en Bodega (FlatList #17) ───────────────────

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { EstadoUIRenderer } from "../EstadoUIRenderer";
import { Icon } from "../Icon";
import { Masthead } from "../Masthead";
import { PedidoCard } from "../PedidoCard";
import { EstadisticasPedidos } from "../../context/PedidosContext";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../../theme/tokens";
import { EstadoUI, Pedido } from "../../types/pedido";

interface Props {
  estadoPedidosFiltrados: EstadoUI<Pedido[]>;
  estadisticas: EstadisticasPedidos;
  esAdmin: boolean;
  busquedaGlobal: string;
  refrescando: boolean;
  onLimpiarBusqueda: () => void;
  onIrANuevoPedido: () => void;
  onDesplazarFormulario: () => void;
  onRecargar: () => void;
  onVaciarOrdenes: () => void;
  onAvanzarEstado: (codigo: string) => void;
  onCopiarCodigo: (codigo: string) => void;
  onCancelarPedido: (codigo: string) => void;
}

export function PedidosLocalList({
  estadoPedidosFiltrados,
  estadisticas,
  esAdmin,
  busquedaGlobal,
  refrescando,
  onLimpiarBusqueda,
  onIrANuevoPedido,
  onDesplazarFormulario,
  onRecargar,
  onVaciarOrdenes,
  onAvanzarEstado,
  onCopiarCodigo,
  onCancelarPedido,
}: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();

  return (
    <View>
      <View style={styles.listaEncabezado}>
        <Masthead
          eyebrow="Monitor de courier"
          titulo="Órdenes de envío"
          variante="tecnico"
          descripcion={
            estadisticas.total === 0
              ? "Sin órdenes activas en este momento."
              : `${estadisticas.activos} en ruta · ${estadisticas.entregados} entregadas de ${estadisticas.total} órdenes.`
          }
          acciones={
            <>
              {esAdmin && estadisticas.total > 0 ? (
                <Pressable
                  onPress={onVaciarOrdenes}
                  accessibilityRole="button"
                  accessibilityLabel="Vaciar las órdenes registradas"
                  style={({ pressed }) => [
                    styles.botonIcono,
                    {
                      minWidth: puntoMinimo,
                      minHeight: puntoMinimo,
                      borderColor: colores.borde,
                      backgroundColor: colores.superficie,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Icon
                    name="rotate-ccw"
                    size={17}
                    color={colores.tintaSecundaria}
                  />
                </Pressable>
              ) : null}
              {esAdmin ? (
                <Boton
                  etiqueta="+ Nuevo pedido"
                  compacto
                  onPress={onIrANuevoPedido}
                />
              ) : null}
            </>
          }
        />
      </View>

      <EstadoUIRenderer
        estado={estadoPedidosFiltrados}
        mensajeVacio={
          busquedaGlobal.trim()
            ? `Sin órdenes para "${busquedaGlobal.trim()}".`
            : "No hay despachos registrados. Crea una orden para comenzar."
        }
        accionVacia={
          busquedaGlobal.trim()
            ? {
                etiqueta: "Limpiar búsqueda",
                onPress: onLimpiarBusqueda,
              }
            : {
                etiqueta: esAdmin
                  ? "Nuevo pedido completo"
                  : "Crear la primera orden",
                onPress: esAdmin ? onIrANuevoPedido : onDesplazarFormulario,
              }
        }
        onReintentar={onRecargar}
        renderDatos={(datos: Pedido[]) => (
          <FlatList
            data={datos}
            keyExtractor={(pedido) => pedido.codigo}
            scrollEnabled={false}
            initialNumToRender={10}
            windowSize={5}
            contentContainerStyle={styles.tarjetasLista}
            renderItem={({ item: pedido }) => (
              <PedidoCard
                pedido={pedido}
                onAvanzarEstado={onAvanzarEstado}
                onCopiarCodigo={onCopiarCodigo}
                onCancelarPedido={onCancelarPedido}
              />
            )}
            ListFooterComponent={
              refrescando ? (
                <Text
                  style={[
                    tipografia.caption,
                    styles.actualizando,
                    { color: colores.tintaTerciaria },
                  ]}
                >
                  Actualizando…
                </Text>
              ) : undefined
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listaEncabezado: {
    marginTop: ESPACIOS.xs,
  },
  botonIcono: {
    borderRadius: RADIOS.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  tarjetasLista: {
    gap: ESPACIOS.md,
  },
  actualizando: {
    textAlign: "center",
    paddingVertical: ESPACIOS.sm,
  },
});
