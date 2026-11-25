// ─── Tarjeta de pedido (vista de bodega) ─────────────────────────
//
// Referencia Atelier Noir: borde 1px --line, radio 24px, código en
// DM Mono, píldora de estado, desglose de prendas y acción única clara.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Boton } from "./Boton";
import { EstadoPedidoBadge } from "./EstadoPedidoBadge";
import { Icon } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../theme/tokens";
import {
  ETIQUETAS_ESTADO,
  FLUJO_ESTADOS,
  Pedido,
} from "../types/pedido";

interface Props {
  pedido: Pedido;
  onAvanzarEstado: (codigo: string) => void;
  onCopiarCodigo?: (codigo: string) => void;
  /** Habilita la cancelación de órdenes en estado `recibido`. */
  onCancelarPedido?: (codigo: string) => void;
}

export function PedidoCard({
  pedido,
  onAvanzarEstado,
  onCopiarCodigo,
  onCancelarPedido,
}: Props) {
  const { colores, tipografia, modo } = useTema();
  const indiceActual = FLUJO_ESTADOS.indexOf(pedido.estado);
  const esUltimoEstado = indiceActual === FLUJO_ESTADOS.length - 1;
  const siguienteEstado = esUltimoEstado
    ? null
    : FLUJO_ESTADOS[indiceActual + 1];
  const cancelado = pedido.cancelado === true;
  const puedeCancelar =
    !cancelado && pedido.estado === "recibido" && Boolean(onCancelarPedido);

  const formatearPrecio = (valor: number) =>
    "$" + valor.toLocaleString("es-CL");

  // Color AA-seguro para el botón de avance según el siguiente estado.
  const fondoAvance = siguienteEstado
    ? siguienteEstado === "listo"
      ? colores.primario
      : colores.estado[siguienteEstado]
    : colores.primario;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      {/* Encabezado: código + píldora de estado */}
      <View style={styles.encabezado}>
        <View style={styles.bloqueCodigo}>
          <Text
            style={[
              tipografia.eyebrowMono,
              { color: colores.tintaTerciaria },
            ]}
          >
            ORDEN
          </Text>
          <Text
            style={[
              tipografia.codigo,
              styles.codigo,
              { color: colores.tinta },
            ]}
          >
            #{pedido.codigo}
          </Text>
        </View>
        <EstadoPedidoBadge estado={pedido.estado} compacto />
      </View>

      {/* Destinatario y ruta */}
      <View style={styles.bloqueCliente}>
        <View style={styles.lineaDato}>
          <Icon name="user" size={15} color={colores.tintaTerciaria} />
          <Text
            style={[
              tipografia.cuerpoFuerte,
              styles.textoDato,
              { color: colores.tinta },
            ]}
            numberOfLines={1}
          >
            {pedido.clienteNombre}
          </Text>
        </View>
        <View style={styles.lineaDato}>
          <Icon name="map-pin" size={15} color={colores.tintaTerciaria} />
          <Text
            style={[
              tipografia.caption,
              styles.textoDato,
              { color: colores.tintaSecundaria },
            ]}
            numberOfLines={2}
          >
            {pedido.direccionDespacho}, {pedido.comuna}
          </Text>
        </View>
        <View style={styles.lineaDato}>
          <Icon name="truck" size={15} color={colores.acentoIntenso} />
          <Text
            style={[
              tipografia.caption,
              { color: colores.acentoIntenso, fontFamily: FUENTES.semi, flex: 1 },
            ]}
          >
            {pedido.metodoEnvio}
            {pedido.metodoPago ? ` · ${pedido.metodoPago}` : ""}
          </Text>
        </View>
        {pedido.notaInterna ? (
          <View style={styles.lineaDato}>
            <Icon name="file-text" size={14} color={colores.tintaTerciaria} />
            <Text
              style={[
                tipografia.caption,
                styles.textoDato,
                { color: colores.tintaSecundaria },
              ]}
              numberOfLines={2}
            >
              Nota bodega: {pedido.notaInterna}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Contenido del paquete */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficieHundida,
            borderColor: colores.borde,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <Text
          style={[
            tipografia.micro,
            { color: colores.tintaTerciaria },
          ]}
        >
          PRENDAS ({pedido.items.length})
        </Text>

        {pedido.items.map((item, i) => (
          <View key={`${item.nombre}-${i}`} style={styles.itemFila}>
            <View style={styles.itemDetalle}>
              <Text
                style={[
                  tipografia.etiqueta,
                  styles.itemNombre,
                  { color: colores.tinta },
                ]}
                numberOfLines={1}
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
                  {[item.talla ? `Talla ${item.talla}` : null, item.color]
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
                {formatearPrecio(item.precioUnitario * item.cantidad)}
              </Text>
            ) : null}
          </View>
        ))}

        <View style={[styles.totalFila, { borderTopColor: colores.borde }]}>
          <Text
            style={[tipografia.etiqueta, { color: colores.tintaSecundaria }]}
          >
            Total
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            {formatearPrecio(pedido.totalEstimado ?? 0)}
          </Text>
        </View>
      </View>

      {/* Acción primaria */}
      {cancelado ? (
        <View
          style={[
            styles.selloCancelado,
            {
              backgroundColor: colores.errorSuave,
              borderColor: colores.error,
              borderRadius: RADIOS.sm,
            },
          ]}
        >
          <Icon name="circle-alert" size={16} color={colores.error} />
          <Text style={[tipografia.etiqueta, { color: colores.error }]}>
            Cancelado
          </Text>
          {pedido.motivoCancelacion ? (
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              numberOfLines={1}
            >
              {pedido.motivoCancelacion}
            </Text>
          ) : null}
        </View>
      ) : !esUltimoEstado && siguienteEstado ? (
        <View style={styles.acciones}>
          <Boton
            etiqueta={`Avanzar a ${ETIQUETAS_ESTADO[siguienteEstado]}`}
            iconoDerecha="arrow-right"
            onPress={() => onAvanzarEstado(pedido.codigo)}
            style={[
              styles.botonAvanzar,
              {
                backgroundColor: fondoAvance,
                borderRadius: RADIOS.sm,
              },
            ]}
            accessibilityLabel={`Avanzar pedido ${pedido.codigo} a ${ETIQUETAS_ESTADO[siguienteEstado]}`}
            accessibilityHint="Cambia el estado del despacho en el servidor"
          />
          {puedeCancelar ? (
            <Boton
              etiqueta="Cancelar"
              icono="x"
              variante="fantasma"
              compacto
              onPress={() => onCancelarPedido?.(pedido.codigo)}
              style={styles.botonCancelar}
              accessibilityLabel={`Cancelar pedido ${pedido.codigo}`}
              accessibilityHint="Cancela la orden y devuelve las prendas al stock"
            />
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.selloEntregado,
            {
              backgroundColor: colores.estadoSuave.entregado,
              borderColor: colores.borde,
              borderRadius: RADIOS.sm,
            },
          ]}
        >
          <Icon
            name="circle-check"
            size={16}
            color={colores.estado.entregado}
          />
          <Text
            style={[tipografia.etiqueta, { color: colores.estado.entregado }]}
          >
            Despacho completado
          </Text>
        </View>
      )}

      {/* Pie */}
      <View style={styles.pie}>
        <Text style={[tipografia.caption, { color: colores.tintaTerciaria }]}>
          Actualizado{" "}
          {new Date(pedido.actualizadoEn).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {onCopiarCodigo ? (
          <Boton
            etiqueta="Copiar código"
            icono="copy"
            variante="fantasma"
            compacto
            onPress={() => onCopiarCodigo(pedido.codigo)}
            accessibilityLabel={`Copiar el código ${pedido.codigo}`}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ESPACIOS.lg,
    marginBottom: ESPACIOS.md,
    borderWidth: 1,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  bloqueCodigo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: ESPACIOS.sm,
  },
  codigo: {
    letterSpacing: 1.2,
  },
  bloqueCliente: {
    marginTop: ESPACIOS.md,
    gap: ESPACIOS.xs + 2,
  },
  lineaDato: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.sm,
  },
  textoDato: {
    flex: 1,
    minWidth: 0,
  },
  panel: {
    marginTop: ESPACIOS.md,
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  itemFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  itemDetalle: {
    flex: 1,
    minWidth: 0,
  },
  itemNombre: {
    marginBottom: 1,
  },
  totalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: ESPACIOS.sm,
    marginTop: ESPACIOS.xs,
  },
  botonAvanzar: {
    width: "100%",
  },
  acciones: {
    marginTop: ESPACIOS.md,
    gap: ESPACIOS.sm,
  },
  botonCancelar: {
    alignSelf: "flex-start",
  },
  selloCancelado: {
    marginTop: ESPACIOS.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    minHeight: 44,
    paddingVertical: ESPACIOS.sm,
    flexWrap: "wrap",
  },
  selloEntregado: {
    marginTop: ESPACIOS.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    minHeight: 44,
    paddingVertical: ESPACIOS.sm,
  },
  pie: {
    marginTop: ESPACIOS.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
});
