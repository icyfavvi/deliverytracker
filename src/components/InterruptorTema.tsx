// ─── Interruptor de tema ─────────────────────────────────────────
//
// Un solo toque alterna entre papel y tinta. El icono anticipa qué va a
// pasar: sol = ahora hay sol (toca para oscurecer), luna = ahora hay
// noche (toca para aclarar).

import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { Icon } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

export function InterruptorTema() {
  const { modo, colores, alternarTema, puntoMinimo } = useTema();
  const esOscuro = modo === "oscuro";

  return (
    <Pressable
      onPress={alternarTema}
      accessibilityRole="button"
      accessibilityLabel={
        esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
      accessibilityState={{ selected: esOscuro }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.boton,
        {
          minWidth: puntoMinimo,
          minHeight: puntoMinimo,
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.pill,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon
        name={esOscuro ? "sun" : "moon"}
        size={18}
        color={esOscuro ? colores.advertencia : colores.acento}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    cursor: "pointer",
    paddingHorizontal: ESPACIOS.sm,
  },
});
