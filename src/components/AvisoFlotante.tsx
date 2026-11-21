// ─── Aviso flotante (toast) ──────────────────────────────────────
//
// Confirmaciones y cambios de estado. Aparece arriba, se lee, y se va
// solo. Nunca tapa el contenido de forma permanente y siempre anuncia
// su texto a los lectores de pantalla.

import React, { useEffect, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, LucideIconName } from "./Icon";
import { useReducirMovimiento } from "../hooks/useReducirMovimiento";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraFlotante, TRANSICIONES } from "../theme/tokens";

export type TonoAviso = "info" | "exito" | "error" | "acento";

interface Props {
  visible: boolean;
  tono?: TonoAviso;
  icono?: LucideIconName;
  titulo: string;
  mensaje?: string;
  /** Acción opcional dentro del aviso (ej. "Copiar código"). */
  accion?: { etiqueta: string; icono?: LucideIconName; onPress: () => void };
  onCerrar?: () => void;
}

export function AvisoFlotante({
  visible,
  tono = "info",
  icono,
  titulo,
  mensaje,
  accion,
  onCerrar,
}: Props) {
  const { colores, tipografia, zIndex, modo } = useTema();
  const reducirMovimiento = useReducirMovimiento();
  // Los valores animados viven en useMemo: son objetos estables que React
  // puede leer durante el render sin que eso rompa las reglas de hooks.
  const opacidad = useMemo(() => new Animated.Value(0), []);
  const desplazamiento = useMemo(() => new Animated.Value(-24), []);

  useEffect(() => {
    if (visible) {
      if (reducirMovimiento) {
        opacidad.setValue(1);
        desplazamiento.setValue(0);
        return;
      }
      Animated.parallel([
        Animated.timing(opacidad, {
          toValue: 1,
          duration: TRANSICIONES.media,
          useNativeDriver: true,
        }),
        Animated.timing(desplazamiento, {
          toValue: 0,
          duration: TRANSICIONES.media,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacidad, {
          toValue: 0,
          duration: TRANSICIONES.rapida,
          useNativeDriver: true,
        }),
        Animated.timing(desplazamiento, {
          toValue: -24,
          duration: TRANSICIONES.rapida,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacidad, desplazamiento, reducirMovimiento]);

  if (!visible) return null;

  const color = colores[tono];

  return (
    <Animated.View
      style={[
        styles.contenedor,
        {
          opacity: opacidad,
          transform: [{ translateY: desplazamiento }],
          zIndex: zIndex.aviso,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          styles.tarjeta,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
            borderRadius: RADIOS.lg,
          },
          sombraFlotante(modo),
        ]}
      >
        <View style={[styles.indicador, { backgroundColor: color }]} />

        <View style={styles.contenido}>
          <Icon name={icono ?? "bell"} size={17} color={color} />
          <View style={styles.textos}>
            <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>{titulo}</Text>
            {mensaje ? (
              <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
                {mensaje}
              </Text>
            ) : null}
          </View>
        </View>

        {accion ? (
          <Pressable
            onPress={accion.onPress}
            accessibilityRole="button"
            accessibilityLabel={accion.etiqueta}
            style={({ pressed }) => [
              styles.accion,
              {
                borderColor: colores.borde,
                borderRadius: RADIOS.sm,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {accion.icono ? (
              <Icon name={accion.icono} size={13} color={colores.tinta} />
            ) : null}
            <Text style={[tipografia.micro, { color: colores.tinta }]}>
              {accion.etiqueta}
            </Text>
          </Pressable>
        ) : null}

        {onCerrar ? (
          <Pressable
            onPress={onCerrar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
            style={styles.cerrar}
          >
            <Icon name="x" size={15} color={colores.tintaTerciaria} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: "absolute",
    top: ESPACIOS.sm,
    left: ESPACIOS.md,
    right: ESPACIOS.md,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    paddingRight: ESPACIOS.md,
  },
  indicador: {
    width: 4,
    alignSelf: "stretch",
  },
  contenido: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingVertical: ESPACIOS.md,
    paddingLeft: ESPACIOS.md,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  cerrar: {
    padding: ESPACIOS.xs,
    cursor: "pointer",
  },
  accion: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.sm,
    borderWidth: 1,
    cursor: "pointer",
  },
});
