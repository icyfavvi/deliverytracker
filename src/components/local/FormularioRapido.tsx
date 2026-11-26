// ─── Formulario Rápido de Despacho en Bodega (FlatList #16) ──────

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { ItemPedido } from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";
import { CatalogoSKU, PrendaRapidaSku } from "./CatalogoSKU";

interface Props {
  nombre: string;
  direccion: string;
  comuna: string;
  items: ItemPedido[];
  catalogoRapido: PrendaRapidaSku[];
  itemNombreManual: string;
  tallaManual: string;
  creando: boolean;
  errorNombre: string | null;
  errorItems: string | null;
  cantidadPrendas: number;
  totalEstimado: number;
  onCambiarNombre: (texto: string) => void;
  onCambiarDireccion: (texto: string) => void;
  onCambiarComuna: (texto: string) => void;
  onCambiarItemManual: (texto: string) => void;
  onCambiarTallaManual: (texto: string) => void;
  onAgregarPrenda: (cat: PrendaRapidaSku) => void;
  onAgregarItemManual: () => void;
  onCambiarCantidad: (indice: number, delta: number) => void;
  onEliminarItem: (indice: number) => void;
  onCrearPedido: () => void;
}

function prendasPlural(cantidad: number): string {
  return cantidad === 1 ? " prenda" : " prendas";
}

export function FormularioRapido({
  nombre,
  direccion,
  comuna,
  items,
  catalogoRapido,
  itemNombreManual,
  tallaManual,
  creando,
  errorNombre,
  errorItems,
  cantidadPrendas,
  totalEstimado,
  onCambiarNombre,
  onCambiarDireccion,
  onCambiarComuna,
  onCambiarItemManual,
  onCambiarTallaManual,
  onAgregarPrenda,
  onAgregarItemManual,
  onCambiarCantidad,
  onEliminarItem,
  onCrearPedido,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.tarjetaFormulario,
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
          styles.badgeSeccion,
          { backgroundColor: colores.acentoSuave, borderRadius: RADIOS.pill },
        ]}
      >
        <Text style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}>
          DESPACHO RÁPIDO
        </Text>
      </View>

      <Text
        style={[
          tipografia.tituloDashboard,
          styles.tituloSeccion,
          { color: colores.tinta },
        ]}
      >
        Crear orden rápida
      </Text>

      <CampoTexto
        etiqueta="Cliente / Comprador"
        valor={nombre}
        onCambio={onCambiarNombre}
        placeholder="Ej: Camila Silva"
        icono="user"
        error={errorNombre}
        autoCapitalize="words"
      />

      <CampoTexto
        etiqueta="Dirección de envío"
        valor={direccion}
        onCambio={onCambiarDireccion}
        placeholder="Ej: Av. Providencia 1450, Dpto 802"
        icono="map-pin"
        autoCapitalize="words"
      />

      <CampoTexto
        etiqueta="Comuna / Ciudad"
        valor={comuna}
        onCambio={onCambiarComuna}
        placeholder="Ej: Providencia, Santiago"
        icono="map-pin"
        autoCapitalize="words"
      />

      <CatalogoSKU
        catalogo={catalogoRapido}
        onAgregarPrenda={onAgregarPrenda}
      />

      <View style={styles.filaManual}>
        <View style={styles.filaManualCampo}>
          <CampoTexto
            etiqueta="Otra prenda"
            valor={itemNombreManual}
            onCambio={onCambiarItemManual}
            placeholder="Escribe el nombre de la prenda"
            icono="shirt"
            autoCapitalize="sentences"
          />
        </View>
        <View style={styles.filaManualTalla}>
          <CampoTexto
            etiqueta="Talla"
            valor={tallaManual}
            onCambio={onCambiarTallaManual}
            placeholder="M"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
      </View>
      <Boton
        etiqueta="Agregar prenda personalizada"
        icono="plus"
        variante="secundario"
        onPress={onAgregarItemManual}
        anchoCompleto
        style={styles.botonAgregarManual}
      />

      <View
        style={[
          styles.panelPrendas,
          {
            backgroundColor: colores.superficieHundida,
            borderRadius: RADIOS.md,
            borderColor: errorItems ? colores.error : colores.borde,
          },
        ]}
      >
        <View style={styles.panelPrendasEncabezado}>
          <Text
            style={[
              tipografia.eyebrowMono,
              { color: colores.tintaSecundaria },
            ]}
          >
            PAQUETE ({cantidadPrendas}
            {prendasPlural(cantidadPrendas)})
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            {formatearCLP(totalEstimado)}
          </Text>
        </View>

        {items.length === 0 ? (
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            El paquete está vacío. Agrega prendas desde el catálogo o a mano.
          </Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item.sku ?? item.nombre}-${idx}`}
            scrollEnabled={false}
            contentContainerStyle={styles.listaItems}
            renderItem={({ item, index: indice }) => (
              <View
                style={[
                  styles.prendaItemTarjeta,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <View style={styles.prendaItemTexto}>
                  <Text
                    style={[tipografia.etiqueta, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {item.nombre}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {[item.talla ? `Talla ${item.talla}` : null, item.color]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => onCambiarCantidad(indice, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar una unidad de ${item.nombre}`}
                    style={({ pressed }) => [
                      styles.stepperBoton,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        borderColor: colores.borde,
                        backgroundColor: colores.superficieHundida,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Icon name="minus" size={15} color={colores.tinta} />
                  </Pressable>

                  <Text
                    style={[
                      tipografia.micro,
                      styles.stepperCantidad,
                      { color: colores.tinta },
                    ]}
                  >
                    {item.cantidad}
                  </Text>

                  <Pressable
                    onPress={() => onCambiarCantidad(indice, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar una unidad de ${item.nombre}`}
                    style={({ pressed }) => [
                      styles.stepperBoton,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        borderColor: colores.borde,
                        backgroundColor: colores.superficieHundida,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Icon name="plus" size={15} color={colores.tinta} />
                  </Pressable>

                  <Pressable
                    onPress={() => onEliminarItem(indice)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.nombre} del paquete`}
                    style={({ pressed }) => [
                      styles.eliminarItem,
                      {
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
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
        )}

        {errorItems ? (
          <View style={styles.errorFila}>
            <Icon name="circle-alert" size={14} color={colores.error} />
            <Text
              accessibilityRole="alert"
              style={[tipografia.caption, { color: colores.error, flex: 1 }]}
            >
              {errorItems}
            </Text>
          </View>
        ) : null}
      </View>

      <Boton
        etiqueta={creando ? "Generando orden…" : "Crear orden de despacho"}
        icono="package-check"
        onPress={onCrearPedido}
        cargando={creando}
        anchoCompleto
        style={styles.botonCrear}
        accessibilityHint="Registra la orden y la publica para el cliente"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjetaFormulario: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
  },
  badgeSeccion: {
    alignSelf: "flex-start",
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
    marginBottom: ESPACIOS.sm,
  },
  tituloSeccion: {
    marginBottom: ESPACIOS.lg,
  },
  filaManual: {
    flexDirection: "row",
    gap: ESPACIOS.md,
  },
  filaManualCampo: {
    flex: 3,
    minWidth: 0,
  },
  filaManualTalla: {
    flex: 1,
    minWidth: 0,
  },
  botonAgregarManual: {
    marginBottom: ESPACIOS.lg,
    marginTop: -ESPACIOS.sm,
  },
  panelPrendas: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
    marginBottom: ESPACIOS.lg,
  },
  panelPrendasEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listaItems: {
    gap: ESPACIOS.sm,
  },
  prendaItemTarjeta: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  prendaItemTexto: {
    gap: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  stepperBoton: {
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  stepperCantidad: {
    minWidth: 22,
    textAlign: "center",
  },
  eliminarItem: {
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonCrear: {
    marginTop: ESPACIOS.xs,
  },
});
