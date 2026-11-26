// ─── Bloque 3: Formulario de Despacho RM ─────────────────────────

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CampoTexto } from "../CampoTexto";
import {
  COMUNAS_RM,
  TRANSPORTISTAS,
  VENTANAS_HORARIAS,
} from "../../services/operacionesMock";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { Transportista } from "../../types/pedido";

interface Props {
  direccion: string;
  comuna: string;
  transportista: Transportista;
  ventanaHoraria: string;
  notaInterna: string;
  errorDireccion?: string;
  errorComuna?: string;
  onCambiarDireccion: (txt: string) => void;
  onCambiarComuna: (txt: string) => void;
  onCambiarTransportista: (t: Transportista) => void;
  onCambiarVentana: (vh: string) => void;
  onCambiarNota: (txt: string) => void;
}

export function FormDespacho({
  direccion,
  comuna,
  transportista,
  ventanaHoraria,
  notaInterna,
  errorDireccion,
  errorComuna,
  onCambiarDireccion,
  onCambiarComuna,
  onCambiarTransportista,
  onCambiarVentana,
  onCambiarNota,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View style={styles.panelHead}>
        <Text
          style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
        >
          BLOQUE 3 · DESPACHO (RM)
        </Text>
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Dirección y courier
        </Text>
      </View>

      <CampoTexto
        etiqueta="Dirección de entrega"
        valor={direccion}
        onCambio={onCambiarDireccion}
        placeholder="Av. Providencia 1450, Dpto 802"
        icono="map-pin"
        error={errorDireccion}
      />

      <View style={styles.grupoChips}>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          COMUNA (REGIÓN METROPOLITANA)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsFila}
        >
          {COMUNAS_RM.map((c) => {
            const activa = comuna.trim().toLowerCase() === c.toLowerCase();
            return (
              <Pressable
                key={c}
                onPress={() => onCambiarComuna(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                style={[
                  styles.chipOpcion,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: activa
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: activa ? colores.acento : colores.borde,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: activa
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                      fontFamily: activa ? FUENTES.semi : FUENTES.medio,
                    },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <CampoTexto
          etiqueta="Otra comuna RM / confirmar"
          valor={comuna}
          onCambio={onCambiarComuna}
          placeholder="Ej: Providencia"
          icono="map-pin"
          error={errorComuna}
        />
      </View>

      <View style={styles.grupoChips}>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          TRANSPORTISTA
        </Text>
        <View style={styles.chipsWrap}>
          {TRANSPORTISTAS.map((t) => {
            const activo = transportista === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => onCambiarTransportista(t.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={[
                  styles.courierCard,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: activo
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: activo ? colores.acento : colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.etiqueta,
                    { color: activo ? colores.acentoIntenso : colores.tinta },
                  ]}
                >
                  {t.etiqueta}
                </Text>
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  {t.detalle}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.grupoChips}>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          VENTANA HORARIA
        </Text>
        <View style={styles.chipsWrap}>
          {VENTANAS_HORARIAS.map((vh) => {
            const activa = ventanaHoraria === vh;
            return (
              <Pressable
                key={vh}
                onPress={() => onCambiarVentana(vh)}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                style={[
                  styles.chipOpcion,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: activa
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: activa ? colores.acento : colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: activa
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                      fontFamily: activa ? FUENTES.semi : FUENTES.medio,
                    },
                  ]}
                >
                  {vh}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <CampoTexto
        etiqueta="Nota interna (bodega / courier)"
        valor={notaInterna}
        onCambio={onCambiarNota}
        placeholder="Ej: Llamar al llegar a conserjería, empaque regalo…"
        icono="file-text"
        multilinea
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHead: { gap: 2 },
  grupoChips: { gap: ESPACIOS.xs + 2 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm },
  chipsFila: { gap: ESPACIOS.sm, paddingVertical: 2 },
  chipOpcion: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  courierCard: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: ESPACIOS.sm,
    borderWidth: 1,
    minWidth: 105,
    cursor: "pointer",
  },
});
