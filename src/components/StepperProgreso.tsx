// ─── Timeline de despacho (4 pasos) ────────────────────────────────
//
// Referencia Atelier Noir: línea de tiempo de 4 etapas (Confirmada,
// Preparando, En camino, Entregado). Los pasos cumplidos se pintan con
// el color vivo del estado y el paso activo destaca con un halo suave.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS } from "../theme/tokens";
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
  const colorActivo = colores.puntoEstado[estado];
  const colorTextoActivo = colores.estado[estado];
  const haloActivo = colores.estadoSuave[estado];
  const ultimo = FLUJO_ESTADOS.length - 1;

  return (
    <View
      style={styles.contenedor}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progreso del despacho: paso ${indiceActual + 1} de ${FLUJO_ESTADOS.length}, ${ETIQUETAS_ESTADO_CORTA[estado]}`}
    >
      {FLUJO_ESTADOS.map((paso, indice) => {
        const completado = indice <= indiceActual;
        const esActual = indice === indiceActual;

        return (
          <View key={paso} style={styles.paso}>
            <View style={styles.cabeza}>
              {indice > 0 ? (
                <View
                  style={[
                    styles.linea,
                    {
                      backgroundColor:
                        indice <= indiceActual ? colorActivo : colores.borde,
                    },
                  ]}
                />
              ) : null}

              <View
                style={[
                  styles.halo,
                  esActual && { backgroundColor: haloActivo },
                ]}
              >
                <View
                  style={[
                    styles.nodo,
                    {
                      borderColor: completado ? colorActivo : colores.bordeFuerte,
                      backgroundColor: completado ? colorActivo : colores.superficie,
                    },
                  ]}
                >
                  <Icon
                    name={ICONOS_ESTADO[paso]}
                    size={15}
                    color={completado ? "#ffffff" : colores.tintaTerciaria}
                  />
                </View>
              </View>

              {indice < ultimo ? (
                <View
                  style={[
                    styles.linea,
                    {
                      backgroundColor:
                        indice < indiceActual ? colorActivo : colores.borde,
                    },
                  ]}
                />
              ) : null}
            </View>

            <Text
              style={[
                tipografia.caption,
                styles.etiqueta,
                {
                  color: esActual
                    ? colorTextoActivo
                    : completado
                      ? colores.tinta
                      : colores.tintaTerciaria,
                  fontFamily: esActual ? FUENTES.semi : FUENTES.medio,
                },
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
  halo: {
    padding: 4,
    borderRadius: RADIOS.pill,
  },
  nodo: {
    width: 34,
    height: 34,
    borderRadius: RADIOS.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: {
    textAlign: "center",
    marginTop: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.xs,
  },
});
