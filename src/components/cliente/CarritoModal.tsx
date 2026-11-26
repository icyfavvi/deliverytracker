// ─── Modal Rápido de Carrito y Compra Cliente (FlatList #9) ──────

import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraFlotante } from "../../theme/tokens";
import { ItemPedido } from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";

interface Props {
  visible: boolean;
  reducirMovimiento: boolean;
  carrito: ItemPedido[];
  errorCarrito: string | null;
  nombreCompra: string;
  errorNombreCompra: string | null;
  dirCompra: string;
  comunaCompra: string;
  totalCarrito: number;
  creandoCompra: boolean;
  onCerrar: () => void;
  onCambiarCantidad: (item: ItemPedido, delta: number) => void;
  onQuitarItem: (item: ItemPedido) => void;
  onCambiarNombre: (txt: string) => void;
  onCambiarDir: (txt: string) => void;
  onCambiarComuna: (txt: string) => void;
  onConfirmar: () => void;
}

export function CarritoModal({
  visible,
  reducirMovimiento,
  carrito,
  errorCarrito,
  nombreCompra,
  errorNombreCompra,
  dirCompra,
  comunaCompra,
  totalCarrito,
  creandoCompra,
  onCerrar,
  onCambiarCantidad,
  onQuitarItem,
  onCambiarNombre,
  onCambiarDir,
  onCambiarComuna,
  onConfirmar,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducirMovimiento ? "none" : "fade"}
      onRequestClose={onCerrar}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colores.overlay }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modalCard,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraFlotante(modo),
          ]}
        >
          <View style={styles.panelHeadRow}>
            <Text style={[tipografia.titulo, { color: colores.tinta }]}>
              Finalizar compra
            </Text>
            <Pressable
              onPress={onCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar resumen de compra"
              style={{
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={18} color={colores.tinta} />
            </Pressable>
          </View>

          <FlatList
            data={carrito}
            keyExtractor={(item) => item.sku ?? item.nombre}
            style={styles.listaScroll}
            contentContainerStyle={styles.miniLista}
            initialNumToRender={10}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.miniRow,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {item.cantidad}× {item.nombre} ({item.talla})
                  </Text>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    {formatearCLP((item.precioUnitario ?? 0) * item.cantidad)}
                  </Text>
                </View>

                <View style={styles.carritoStepper}>
                  <Pressable
                    onPress={() => onCambiarCantidad(item, -1)}
                    disabled={item.cantidad <= 1}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar una unidad de ${item.nombre}`}
                    accessibilityState={{ disabled: item.cantidad <= 1 }}
                    style={({ pressed }) => [
                      styles.carritoStepperBoton,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        borderColor: colores.borde,
                        backgroundColor: colores.superficie,
                        opacity:
                          item.cantidad <= 1 ? 0.4 : pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Icon name="minus" size={15} color={colores.tinta} />
                  </Pressable>

                  <Text
                    style={[
                      tipografia.micro,
                      styles.carritoCantidad,
                      { color: colores.tinta },
                    ]}
                  >
                    {item.cantidad}
                  </Text>

                  <Pressable
                    onPress={() => onCambiarCantidad(item, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar una unidad de ${item.nombre}`}
                    style={({ pressed }) => [
                      styles.carritoStepperBoton,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        borderColor: colores.borde,
                        backgroundColor: colores.superficie,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Icon name="plus" size={15} color={colores.tinta} />
                  </Pressable>

                  <Pressable
                    onPress={() => onQuitarItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.nombre} del carrito`}
                    style={({ pressed }) => [
                      styles.carritoStepperBoton,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        borderColor: colores.borde,
                        backgroundColor: colores.superficie,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Icon name="trash-2" size={16} color={colores.error} />
                  </Pressable>
                </View>
              </View>
            )}
          />

          {errorCarrito ? (
            <View style={styles.errorFila}>
              <Icon name="circle-alert" size={14} color={colores.error} />
              <Text
                accessibilityRole="alert"
                style={[tipografia.caption, { color: colores.error, flex: 1 }]}
              >
                {errorCarrito}
              </Text>
            </View>
          ) : null}

          <CampoTexto
            etiqueta="Tu nombre"
            valor={nombreCompra}
            onCambio={onCambiarNombre}
            icono="user"
            error={errorNombreCompra}
          />
          <CampoTexto
            etiqueta="Dirección de entrega"
            valor={dirCompra}
            onCambio={onCambiarDir}
            icono="map-pin"
          />
          <CampoTexto
            etiqueta="Comuna (RM)"
            valor={comunaCompra}
            onCambio={onCambiarComuna}
            icono="map-pin"
          />

          <View
            style={[styles.subtotalFila, { borderTopColor: colores.borde }]}
          >
            <Text
              style={[tipografia.etiqueta, { color: colores.tintaSecundaria }]}
            >
              Total productos
            </Text>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              {formatearCLP(totalCarrito)}
            </Text>
          </View>

          <Boton
            etiqueta={creandoCompra ? "Procesando…" : "Confirmar compra"}
            icono="package-check"
            cargando={creandoCompra}
            deshabilitado={creandoCompra || carrito.length === 0}
            anchoCompleto
            onPress={onConfirmar}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  panelHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  listaScroll: { maxHeight: 220 },
  miniLista: { gap: ESPACIOS.sm },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    borderWidth: 1,
  },
  carritoStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
  },
  carritoStepperBoton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    cursor: "pointer",
  },
  carritoCantidad: { minWidth: 20, textAlign: "center" },
  errorFila: {
    flexDirection: "row",
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
});
