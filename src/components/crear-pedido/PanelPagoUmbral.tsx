// ─── Configuración de Pago y Umbral de Confirmación ────────────────

import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS } from "../../theme/tokens";
import { MetodoPago } from "../../types/pedido";
import { formatearCLP } from "../../utils/formato";

const METODOS_PAGO: MetodoPago[] = [
  "Transferencia",
  "Link de pago",
  "Débito / Crédito",
];

const PRESETS_UMBRAL = [100_000, 150_000, 250_000, 0] as const;

interface Props {
  metodoPago: MetodoPago;
  umbralTexto: string;
  umbralConfirmacion: number;
  onCambiarMetodoPago: (m: MetodoPago) => void;
  onCambiarUmbralTexto: (txt: string) => void;
}

export function PanelPagoUmbral({
  metodoPago,
  umbralTexto,
  umbralConfirmacion,
  onCambiarMetodoPago,
  onCambiarUmbralTexto,
}: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();

  return (
    <>
      <View style={styles.grupoChips}>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          MÉTODO DE PAGO
        </Text>
        <View style={styles.chipsWrap}>
          {METODOS_PAGO.map((m) => {
            const activo = metodoPago === m;
            return (
              <Pressable
                key={m}
                onPress={() => onCambiarMetodoPago(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={({ pressed }) => [
                  styles.chipOpcion,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: activo
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: activo ? colores.acento : colores.borde,
                    borderRadius: RADIOS.sm,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: activo
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                      fontFamily: activo ? FUENTES.semi : FUENTES.medio,
                    },
                  ]}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.umbralCaja,
          {
            backgroundColor: colores.superficieHundida,
            borderColor: colores.borde,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          CONFIRMAR MONTO ALTO DESDE (CLP)
        </Text>
        <View style={styles.umbralInputFila}>
          <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
            $
          </Text>
          <TextInput
            style={[
              styles.umbralInput,
              tipografia.micro,
              {
                color: colores.tinta,
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.sm,
              },
            ]}
            value={umbralTexto}
            onChangeText={(txt) => onCambiarUmbralTexto(txt.replace(/\D/g, ""))}
            keyboardType="numeric"
            placeholder="0 (sin tope)"
            placeholderTextColor={colores.tintaTerciaria}
            accessibilityLabel="Monto umbral en CLP para pedir confirmación previa"
          />
        </View>
        <View style={styles.chipsWrap}>
          {PRESETS_UMBRAL.map((monto) => {
            const seleccionado = umbralConfirmacion === monto;
            return (
              <Pressable
                key={String(monto)}
                onPress={() => onCambiarUmbralTexto(String(monto))}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
                style={[
                  styles.chipMini,
                  {
                    minHeight: 36,
                    backgroundColor: seleccionado
                      ? colores.acentoSuave
                      : colores.superficie,
                    borderColor: seleccionado ? colores.acento : colores.borde,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: seleccionado
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                    },
                  ]}
                >
                  {monto === 0 ? "Sin tope" : formatearCLP(monto)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grupoChips: { gap: ESPACIOS.xs + 2 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm },
  chipOpcion: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  chipMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  umbralCaja: { padding: ESPACIOS.md, borderWidth: 1, gap: ESPACIOS.sm },
  umbralInputFila: { flexDirection: "row", alignItems: "center", gap: ESPACIOS.xs },
  umbralInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: ESPACIOS.md,
  },
});
