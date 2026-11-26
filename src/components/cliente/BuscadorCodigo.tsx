// ─── Hero Buscador de Código de Seguimiento (4 chars) ────────────

import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";

interface Props {
  esAncho: boolean;
  codigoInput: string;
  errorCodigo: string | null;
  inputRef: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
  onCambiarCodigo: (txt: string) => void;
  onBuscar: () => void;
}

export function BuscadorCodigo({
  esAncho,
  codigoInput,
  errorCodigo,
  inputRef,
  onCambiarCodigo,
  onBuscar,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const [campoEnfocado, setCampoEnfocado] = useState(false);

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: colores.panelOscuro,
          borderColor: colores.panelOscuroBorde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View pointerEvents="none" style={styles.aroExterno} />
      <View style={styles.heroEncabezado}>
        <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>
          CÓDIGO DE ORDEN (4 CARACTERES)
        </Text>
        <Text style={[tipografia.subtitulo, { color: "#ffffff" }]}>
          Consulta el estado de tu despacho en vivo
        </Text>
      </View>

      <View
        style={[
          styles.buscadorCaja,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <View
          style={esAncho ? styles.buscadorFilaAncha : styles.buscadorColumna}
        >
          <View
            style={[
              styles.campoCodigo,
              {
                backgroundColor: campoEnfocado
                  ? colores.superficie
                  : colores.superficieHundida,
                borderRadius: RADIOS.sm,
                borderColor: errorCodigo
                  ? colores.error
                  : campoEnfocado
                    ? colores.acento
                    : colores.borde,
                minHeight: Math.max(puntoMinimo, 50),
              },
            ]}
          >
            <Icon
              name="hash"
              size={17}
              color={
                campoEnfocado ? colores.acentoIntenso : colores.tintaTerciaria
              }
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.inputCodigo,
                tipografia.codigo,
                { color: colores.tinta, fontSize: 18 },
              ]}
              placeholder="ABCD"
              placeholderTextColor={colores.tintaTerciaria}
              value={codigoInput}
              onChangeText={(texto) => onCambiarCodigo(texto.toUpperCase())}
              onFocus={() => setCampoEnfocado(true)}
              onBlur={() => setCampoEnfocado(false)}
              maxLength={4}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={onBuscar}
              accessibilityLabel="Código de seguimiento de tu orden"
            />
            {codigoInput.length > 0 ? (
              <Pressable
                onPress={() => onCambiarCodigo("")}
                accessibilityRole="button"
                accessibilityLabel="Limpiar código"
                style={{
                  minWidth: puntoMinimo,
                  minHeight: puntoMinimo,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={16} color={colores.tintaSecundaria} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.botonRastrear,
              esAncho && styles.botonRastrearAncho,
              {
                backgroundColor: colores.primario,
                borderRadius: RADIOS.sm,
                minHeight: Math.max(puntoMinimo, 50),
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={onBuscar}
            accessibilityRole="button"
            accessibilityLabel="Rastrear pedido"
          >
            <Icon name="search" size={17} color={colores.sobrePrimario} />
            <Text
              style={[tipografia.boton, { color: colores.sobrePrimario }]}
            >
              Rastrear
            </Text>
          </Pressable>
        </View>

        {errorCodigo ? (
          <View style={styles.errorFila}>
            <Icon name="circle-alert" size={14} color={colores.error} />
            <Text
              accessibilityRole="alert"
              style={[tipografia.caption, { color: colores.error, flex: 1 }]}
            >
              {errorCodigo}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  aroExterno: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.24)",
  },
  heroEncabezado: { marginBottom: ESPACIOS.md, gap: ESPACIOS.xs },
  buscadorCaja: { padding: ESPACIOS.sm + 2, borderWidth: 1 },
  buscadorColumna: { gap: ESPACIOS.sm },
  buscadorFilaAncha: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.sm,
  },
  campoCodigo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingLeft: ESPACIOS.md,
    paddingRight: ESPACIOS.xs,
    borderWidth: 1.5,
  },
  inputCodigo: {
    flex: 1,
    minWidth: 0,
    letterSpacing: 3,
    paddingVertical: ESPACIOS.sm,
  },
  botonRastrear: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.xl,
    cursor: "pointer",
  },
  botonRastrearAncho: { minWidth: 148 },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.sm,
  },
});
