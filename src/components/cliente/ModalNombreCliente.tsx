// ─── Modal de Edición de Nombre Cliente ──────────────────────────

import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraFlotante } from "../../theme/tokens";

interface Props {
  visible: boolean;
  reducirMovimiento: boolean;
  nombreInput: string;
  errorNombre: string | null;
  onCambiarNombreInput: (txt: string) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function ModalNombreCliente({
  visible,
  reducirMovimiento,
  nombreInput,
  errorNombre,
  onCambiarNombreInput,
  onGuardar,
  onCerrar,
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
              Cambiar nombre
            </Text>
            <Pressable
              onPress={onCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar editor de nombre"
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

          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Este nombre se mostrará en tu espacio y se usará por defecto en tus
            próximas compras.
          </Text>

          <CampoTexto
            etiqueta="Nombre completo"
            valor={nombreInput}
            onCambio={onCambiarNombreInput}
            placeholder="Ej: Martina Soto"
            icono="user"
            autoCapitalize="words"
            error={errorNombre}
            returnKeyType="done"
            onSubmit={onGuardar}
          />

          <View style={{ gap: ESPACIOS.sm }}>
            <Boton
              etiqueta="Guardar nombre"
              icono="check"
              anchoCompleto
              onPress={onGuardar}
            />
            <Boton
              etiqueta="Cancelar"
              variante="secundario"
              anchoCompleto
              onPress={onCerrar}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});
