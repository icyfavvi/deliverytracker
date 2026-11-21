// ─── Renderizador de los 4 estados de UI ─────────────────────────
//
// Renderiza el estado correcto según el tipo discriminado: en vez de
// if (loading) / if (error) / if (empty), hacemos switch sobre un campo
// que garantiza que solo un estado es posible a la vez.
//
// Cada estado ofrece una salida: el error tiene "Reintentar" y el vacío
// puede recibir una acción. Un mensaje de error sin salida es un muro.

import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Boton } from "./Boton";
import { Icon, LucideIconName } from "./Icon";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";
import { EstadoUI } from "../types/pedido";

interface Props<T> {
  estado: EstadoUI<T>;
  mensajeVacio?: string;
  /** Acción opcional del estado vacío (ej. "Crear la primera orden"). */
  accionVacia?: { etiqueta: string; onPress: () => void };
  /** Acción de reintento del estado de error. */
  onReintentar?: () => void;
  renderDatos: (datos: T) => React.ReactNode;
}

export function EstadoUIRenderer<T>({
  estado,
  mensajeVacio = "No hay datos disponibles.",
  accionVacia,
  onReintentar,
  renderDatos,
}: Props<T>) {
  const { colores, tipografia } = useTema();

  switch (estado.tipo) {
    case "cargando":
      return (
        <View style={styles.centro} accessibilityRole="progressbar">
          <ActivityIndicator size="large" color={colores.acento} />
          <Text style={[tipografia.cuerpo, styles.mensaje, { color: colores.tintaSecundaria }]}>
            Consultando…
          </Text>
        </View>
      );

    case "error":
      return (
        <View style={styles.centro} accessibilityLiveRegion="polite">
          <View
            style={[
              styles.iconoContenedor,
              { backgroundColor: colores.errorSuave, borderRadius: RADIOS.pill },
            ]}
          >
            <Icon name="triangle-alert" size={26} color={colores.error} />
          </View>
          <Text style={[tipografia.subtitulo, styles.titulo, { color: colores.tinta }]}>
            No pudimos actualizar
          </Text>
          <Text style={[tipografia.cuerpo, styles.mensaje, { color: colores.tintaSecundaria }]}>
            {estado.mensaje}
          </Text>
          {onReintentar ? (
            <Boton
              etiqueta="Reintentar"
              icono="refresh-cw"
              variante="secundario"
              onPress={onReintentar}
              style={styles.accion}
              accessibilityHint="Vuelve a intentar la consulta"
            />
          ) : null}
        </View>
      );

    case "vacio":
      return (
        <View style={styles.centro}>
          <View
            style={[
              styles.iconoContenedor,
              { backgroundColor: colores.superficieHundida, borderRadius: RADIOS.pill },
            ]}
          >
            <Icon name="inbox" size={26} color={colores.tintaTerciaria} />
          </View>
          <Text style={[tipografia.cuerpo, styles.mensaje, { color: colores.tintaSecundaria }]}>
            {mensajeVacio}
          </Text>
          {accionVacia ? (
            <Boton
              etiqueta={accionVacia.etiqueta}
              icono="plus"
              variante="secundario"
              onPress={accionVacia.onPress}
              style={styles.accion}
            />
          ) : null}
        </View>
      );

    case "datos":
      return <>{renderDatos(estado.datos)}</>;
  }
}

/** Icono reutilizable para estados vacíos personalizados. */
export function EstadoIlustrado({
  icono,
  titulo,
  mensaje,
}: {
  icono: LucideIconName;
  titulo: string;
  mensaje: string;
}) {
  const { colores, tipografia } = useTema();
  return (
    <View style={styles.centro}>
      <View
        style={[
          styles.iconoContenedor,
          { backgroundColor: colores.superficieHundida, borderRadius: RADIOS.pill },
        ]}
      >
        <Icon name={icono} size={26} color={colores.tintaTerciaria} />
      </View>
      <Text style={[tipografia.subtitulo, styles.titulo, { color: colores.tinta }]}>
        {titulo}
      </Text>
      <Text style={[tipografia.cuerpo, styles.mensaje, { color: colores.tintaSecundaria }]}>
        {mensaje}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ESPACIOS.xxl,
    paddingHorizontal: ESPACIOS.xl,
    gap: ESPACIOS.sm,
  },
  iconoContenedor: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ESPACIOS.xs,
  },
  titulo: {
    textAlign: "center",
  },
  mensaje: {
    textAlign: "center",
    maxWidth: 380,
  },
  accion: {
    marginTop: ESPACIOS.sm,
  },
});
