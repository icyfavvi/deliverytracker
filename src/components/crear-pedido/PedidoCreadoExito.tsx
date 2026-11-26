// ─── Vista de Éxito y Modal de Confirmación (CrearPedidoScreen) ─

import React from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Boton } from "../Boton";
import { EstadoPedidoBadge } from "../EstadoPedidoBadge";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import {
  ESPACIOS,
  RADIOS,
  sombraFlotante,
  sombraTarjeta,
} from "../../theme/tokens";
import { Pedido } from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";

export function PedidoCreadoExito({
  pedidoCreado,
  esAncho,
  onCrearOtro,
}: {
  pedidoCreado: Pedido;
  esAncho: boolean;
  onCrearOtro: () => void;
}) {
  const { colores, tipografia, modo } = useTema();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollExito,
          esAncho && styles.scrollAncho,
        ]}
      >
        <View
          style={[
            styles.tarjetaExito,
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
              styles.iconoExito,
              {
                backgroundColor: colores.exitoSuave,
                borderRadius: RADIOS.pill,
              },
            ]}
          >
            <Icon
              name="circle-check"
              size={34}
              color={colores.puntoEstado.entregado}
            />
          </View>

          <EstadoPedidoBadge estado={pedidoCreado.estado} />

          <Text
            accessibilityRole="header"
            style={[
              tipografia.display,
              styles.tituloExito,
              { color: colores.tinta },
            ]}
          >
            Pedido creado con éxito
          </Text>

          <View
            style={[
              styles.codigoCajaExito,
              {
                backgroundColor: colores.panelOscuro,
                borderColor: colores.panelOscuroBorde,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>
              NÚMERO DE ORDEN · REFERENCIA AN-{pedidoCreado.codigo}
            </Text>
            <Text
              style={[
                tipografia.codigo,
                { color: "#ffffff", fontSize: 28, letterSpacing: 3 },
              ]}
            >
              #{pedidoCreado.codigo}
            </Text>
            <Text style={[tipografia.caption, { color: "#c4cdd8" }]}>
              Comparte el código {pedidoCreado.codigo} para rastreo del cliente
            </Text>
          </View>

          <View
            style={[
              styles.resumenExito,
              {
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <View style={styles.filaResumen}>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Cliente
              </Text>
              <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                {pedidoCreado.clienteNombre}
              </Text>
            </View>
            <View style={styles.filaResumen}>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Despacho
              </Text>
              <Text style={[tipografia.caption, { color: colores.tinta }]}>
                {pedidoCreado.comuna} · {pedidoCreado.metodoEnvio}
              </Text>
            </View>
            <View style={styles.filaResumen}>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Total ({pedidoCreado.metodoPago ?? "Confirmado"})
              </Text>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                {formatearCLP(pedidoCreado.totalEstimado)}
              </Text>
            </View>
          </View>

          <View style={styles.accionesExito}>
            <Boton
              etiqueta="Ver seguimiento"
              icono="package-search"
              anchoCompleto
              onPress={() =>
                router.push({
                  pathname: "/cliente",
                  params: { codigo: pedidoCreado.codigo },
                })
              }
            />
            <Boton
              etiqueta="Crear otro pedido"
              icono="plus"
              variante="secundario"
              anchoCompleto
              onPress={onCrearOtro}
            />
            <Boton
              etiqueta="Volver a Pedidos"
              variante="fantasma"
              anchoCompleto
              onPress={() => router.replace("/")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ModalConfirmacionPedido({
  modalConfirmacion,
  reducirMovimiento,
  clienteNombre,
  total,
  umbralConfirmacion,
  onCancelar,
  onConfirmar,
}: {
  modalConfirmacion: { tipo: "monto_alto" | "duplicado"; pedidoPrevio?: Pedido } | null;
  reducirMovimiento: boolean;
  clienteNombre?: string;
  total: number;
  umbralConfirmacion: number;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const { colores, tipografia, modo } = useTema();

  return (
    <Modal
      visible={modalConfirmacion !== null}
      transparent
      animationType={reducirMovimiento ? "none" : "fade"}
      onRequestClose={onCancelar}
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
          <View
            style={[
              styles.modalIcono,
              {
                backgroundColor: colores.advertenciaSuave,
                borderRadius: RADIOS.pill,
              },
            ]}
          >
            <Icon name="shield-alert" size={24} color={colores.advertencia} />
          </View>

          <Text
            accessibilityRole="header"
            style={[tipografia.titulo, { color: colores.tinta }]}
          >
            {modalConfirmacion?.tipo === "duplicado"
              ? "Posible pedido duplicado"
              : "Confirmación de monto alto"}
          </Text>

          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            {modalConfirmacion?.tipo === "duplicado"
              ? `Ya existe el pedido #${modalConfirmacion.pedidoPrevio?.codigo} para ${clienteNombre} por ${formatearCLP(total)} creado hace menos de 3 minutos. ¿Confirmas crear otro?`
              : `Este pedido suma ${formatearCLP(total)} y supera el umbral configurado (${formatearCLP(umbralConfirmacion)}). ¿Confirmas emitirlo a nombre de ${clienteNombre}?`}
          </Text>

          <View style={styles.modalBotones}>
            <Boton
              etiqueta="Revisar pedido"
              variante="secundario"
              anchoCompleto
              onPress={onCancelar}
            />
            <Boton
              etiqueta="Sí, confirmar pedido"
              icono="check"
              anchoCompleto
              onPress={onConfirmar}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollExito: { flexGrow: 1, padding: ESPACIOS.lg, justifyContent: "center" },
  scrollAncho: { alignItems: "center" },
  tarjetaExito: {
    width: "100%",
    maxWidth: 520,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.md,
  },
  iconoExito: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloExito: { textAlign: "center" },
  codigoCajaExito: {
    width: "100%",
    padding: ESPACIOS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  resumenExito: {
    width: "100%",
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  accionesExito: { width: "100%", gap: ESPACIOS.sm, marginTop: ESPACIOS.xs },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  modalIcono: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBotones: { gap: ESPACIOS.sm, marginTop: ESPACIOS.xs },
});
