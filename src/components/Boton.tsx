// ─── Botón ───────────────────────────────────────────────────────
//
// Único botón reutilizable de la app. Garantiza área táctil mínima
// >= 44x44pt, estados de carga y deshabilitado, y contraste WCAG AA.

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { Icon, LucideIconName } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

export type VarianteBoton = "primario" | "secundario" | "fantasma" | "peligro";

interface Props {
  etiqueta: string;
  onPress: () => void;
  variante?: VarianteBoton;
  icono?: LucideIconName;
  iconoDerecha?: LucideIconName;
  deshabilitado?: boolean;
  cargando?: boolean;
  anchoCompleto?: boolean;
  compacto?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Boton({
  etiqueta,
  onPress,
  variante = "primario",
  icono,
  iconoDerecha,
  deshabilitado = false,
  cargando = false,
  anchoCompleto = false,
  compacto = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();
  const inactivo = deshabilitado || cargando;

  const fondo =
    variante === "primario"
      ? colores.primario
      : variante === "secundario"
        ? colores.superficie
        : variante === "peligro"
          ? colores.error
          : "transparent";

  const colorTexto =
    variante === "primario"
      ? colores.sobrePrimario
      : variante === "peligro"
        ? "#ffffff"
        : variante === "fantasma"
          ? colores.acentoIntenso
          : colores.tinta;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: fondo,
          borderColor:
            variante === "secundario" ? colores.bordeFuerte : "transparent",
          borderWidth: variante === "secundario" ? 1 : 0,
          minHeight: puntoMinimo,
          minWidth: puntoMinimo,
          borderRadius: RADIOS.sm,
          opacity: inactivo ? 0.45 : pressed ? 0.82 : 1,
        },
        anchoCompleto && styles.anchoCompleto,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={colorTexto} />
      ) : (
        <View style={styles.contenido}>
          {icono ? (
            <Icon name={icono} size={compacto ? 15 : 17} color={colorTexto} />
          ) : null}
          <Text
            style={[
              tipografia.boton,
              { color: colorTexto },
              compacto && styles.etiquetaCompacta,
            ]}
            numberOfLines={1}
          >
            {etiqueta}
          </Text>
          {iconoDerecha ? (
            <Icon
              name={iconoDerecha}
              size={compacto ? 15 : 17}
              color={colorTexto}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ESPACIOS.lg,
    cursor: "pointer",
  },
  anchoCompleto: {
    alignSelf: "stretch",
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  etiquetaCompacta: {
    fontSize: 13,
  },
});
