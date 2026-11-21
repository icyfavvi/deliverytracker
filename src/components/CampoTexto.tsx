// ─── Campo de texto ──────────────────────────────────────────────
//
// Campo con etiqueta visible, icono opcional, ayuda, error y estado de
// foco. Nunca se usa un <TextInput> pelado en la app: un campo sin
// etiqueta ni error es un campo que el usuario no entiende.

import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Icon, LucideIconName } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (texto: string) => void;
  placeholder?: string;
  ayuda?: string;
  error?: string | null;
  icono?: LucideIconName;
  multilinea?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmit?: () => void;
  onEnfocar?: () => void;
  accessibilityLabel?: string;
}

export function CampoTexto({
  etiqueta,
  valor,
  onCambio,
  placeholder,
  ayuda,
  error = null,
  icono,
  multilinea = false,
  maxLength,
  autoCapitalize = "sentences",
  autoCorrect = true,
  keyboardType = "default",
  returnKeyType,
  onSubmit,
  onEnfocar,
  accessibilityLabel,
}: Props) {
  const { colores, tipografia, puntoMinimo } = useTema();
  const [enfocado, setEnfocado] = useState(false);

  const colorBorde = error
    ? colores.error
    : enfocado
      ? colores.acento
      : colores.borde;

  return (
    <View style={styles.contenedor}>
      <Text style={[tipografia.micro, styles.etiqueta, { color: colores.tintaSecundaria }]}>
        {etiqueta.toUpperCase()}
      </Text>

      <View
        style={[
          styles.contenedorInput,
          {
            backgroundColor: colores.superficie,
            borderColor: colorBorde,
            borderRadius: RADIOS.md,
            borderWidth: enfocado || error ? 1.5 : 1,
            minHeight: multilinea ? puntoMinimo * 1.6 : puntoMinimo,
            alignItems: multilinea ? "flex-start" : "center",
          },
        ]}
      >
        {icono ? (
          <Icon
            name={icono}
            size={17}
            color={error ? colores.error : colores.tintaTerciaria}
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            tipografia.cuerpo,
            {
              color: colores.tinta,
              paddingVertical: multilinea ? ESPACIOS.md : ESPACIOS.sm,
              textAlignVertical: multilinea ? "top" : "center",
            },
          ]}
          value={valor}
          onChangeText={onCambio}
          placeholder={placeholder}
          placeholderTextColor={colores.tintaTerciaria}
          multiline={multilinea}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmit}
          onFocus={() => {
            setEnfocado(true);
            onEnfocar?.();
          }}
          onBlur={() => setEnfocado(false)}
          accessibilityLabel={accessibilityLabel ?? etiqueta}
          accessibilityHint={ayuda}
        />
      </View>

      {error ? (
        <View style={styles.pieAyuda}>
          <Icon name="circle-alert" size={13} color={colores.error} />
          <Text style={[tipografia.caption, styles.textoAyuda, { color: colores.error }]}>
            {error}
          </Text>
        </View>
      ) : ayuda ? (
        <Text style={[tipografia.caption, styles.textoAyuda, { color: colores.tintaTerciaria }]}>
          {ayuda}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: ESPACIOS.md,
  },
  etiqueta: {
    letterSpacing: 1.3,
    marginBottom: ESPACIOS.xs + 1,
  },
  contenedorInput: {
    flexDirection: "row",
    gap: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    padding: 0,
    margin: 0,
  },
  pieAyuda: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    marginTop: ESPACIOS.xs + 2,
  },
  textoAyuda: {
    flex: 1,
  },
});
