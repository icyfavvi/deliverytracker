// ─── Botón de cerrar sesión ──────────────────────────────────────

import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { Icon } from "./Icon";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

export function BotonSalir() {
  const { salir, sesion } = useAuth();
  const { colores, puntoMinimo } = useTema();

  return (
    <Pressable
      onPress={() => {
        void salir();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Cerrar sesión de ${sesion?.usuario ?? "usuario"}`}
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
      <Icon name="log-out" size={18} color={colores.tintaSecundaria} />
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
    marginRight: ESPACIOS.sm,
  },
});
