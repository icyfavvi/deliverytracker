// ─── Stepper de despacho (4 pasos) ────────────────────────────────
//
// La línea de tiempo del pedido. Cada paso es un nodo con icono; los
// pasos cumplidos van llenos con el color del estado actual y el paso
// vigente se marca con un anillo. La etiqueta del paso se muestra
// siempre: el color solo es un refuerzo, nunca el único indicador.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";
import {
  ETIQUETAS_ESTADO_CORTA,
  EstadoPedido,
  FLUJO_ESTADOS,
  ICONOS_ESTADO,
} from "../types/pedido";

interface Props {
  estado: EstadoPedido;
}

export function StepperProgreso({ estado }: Props) {
  const { colores, tipografia } = useTema();
  const indiceActual = FLUJO_ESTADOS.indexOf(estado);
  const colorActual = colores.estado[estado];
  const ultimo = FLUJO_ESTADOS.length - 1;

  return (
    <View
      style={styles.contenedor}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progreso del despacho: paso ${indiceActual + 1} de ${FLUJO_ESTADOS.length}`}
    >
      {FLUJO_ESTADOS.map((paso, indice) => {
        const completado = indice <= indiceActual;
        const esActual = indice === indiceActual;
        const colorNodo = completado ? colorActual : colores.borde;

        return (
          <View key={paso} style={styles.paso}>
            <View style={styles.cabeza}>
              {indice > 0 ? (
                <View
                  style={[
                    styles.linea,
                    {
                      backgroundColor: indice <= indiceActual ? colorActual : colores.borde,
                    },
                  ]}
                />
              ) : null}

              <View
                style={[
                  styles.nodo,
                  {
                    borderColor: colorNodo,
                    backgroundColor: completado ? colorNodo : colores.superficie,
                  },
                  esActual && styles.nodoActual,
                ]}
              >
                <Icon
                  name={ICONOS_ESTADO[paso]}
                  size={15}
                  color={completado ? colores.superficie : colores.tintaTerciaria}
                />
              </View>

              {indice < ultimo ? (
                <View
                  style={[
                    styles.linea,
                    {
                      backgroundColor: indice < indiceActual ? colorActual : colores.borde,
                    },
                  ]}
                />
              ) : null}
            </View>

            <Text
              style={[
                tipografia.micro,
                styles.etiqueta,
                {
                  color: esActual
                    ? colores.tinta
                    : completado
                      ? colores.tintaSecundaria
                      : colores.tintaTerciaria,
                },
                esActual && styles.etiquetaActual,
              ]}
              numberOfLines={2}
            >
              {ETIQUETAS_ESTADO_CORTA[paso]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  paso: {
    flex: 1,
    alignItems: "center",
  },
  cabeza: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  linea: {
    flex: 1,
    height: 2,
  },
  nodo: {
    width: 32,
    height: 32,
    borderRadius: RADIOS.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nodoActual: {
    borderWidth: 3,
  },
  etiqueta: {
    textAlign: "center",
    marginTop: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.xs,
  },
  etiquetaActual: {
    fontWeight: "700",
  },
});
