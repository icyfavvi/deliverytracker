// ─── Cabeceras Desktop y Móvil de PortalShell ────────────────────

import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { BotonSalir } from "../BotonSalir";
import { Icon } from "../Icon";
import { InterruptorTema } from "../InterruptorTema";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";
import {
  AccionExtraPortal,
  PortalNavItem,
  portalStyles as styles,
} from "./estilosPortal";
import { NavItemPortal } from "./NavItemPortal";

interface BuscadorProps {
  busqueda?: string;
  onCambiarBusqueda: (txt: string) => void;
  placeholderBusqueda: string;
  fullWidth?: boolean;
}

function BuscadorPortal({
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda,
  fullWidth = false,
}: BuscadorProps) {
  const { colores, tipografia, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.searchWrap,
        {
          backgroundColor: colores.superficieHundida,
          borderColor: colores.borde,
          borderRadius: RADIOS.sm,
          minHeight: puntoMinimo,
          maxWidth: fullWidth ? undefined : 420,
        },
      ]}
    >
      <Icon name="search" size={16} color={colores.tintaTerciaria} />
      <TextInput
        style={[
          styles.searchInput,
          tipografia.cuerpo,
          { color: colores.tinta },
        ]}
        value={busqueda ?? ""}
        onChangeText={onCambiarBusqueda}
        placeholder={placeholderBusqueda}
        placeholderTextColor={colores.tintaTerciaria}
        accessibilityLabel={placeholderBusqueda}
      />
      {busqueda ? (
        <Pressable
          onPress={() => onCambiarBusqueda("")}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          style={{
            minWidth: puntoMinimo,
            minHeight: puntoMinimo,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="x" size={15} color={colores.tintaSecundaria} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface DesktopHeaderProps {
  usuarioIniciales: string;
  usuarioNombre: string;
  usuarioRol: string;
  busqueda?: string;
  onCambiarBusqueda?: (txt: string) => void;
  placeholderBusqueda: string;
  mostrarSalir: boolean;
  onEditarUsuario?: () => void;
}

export function PortalTopbarDesktop({
  usuarioIniciales,
  usuarioNombre,
  usuarioRol,
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda,
  mostrarSalir,
  onEditarUsuario,
}: DesktopHeaderProps) {
  const { colores, tipografia, puntoMinimo } = useTema();

  const contenidoPill = (
    <>
      <View style={styles.avatarSm}>
        <Text style={[tipografia.caption, styles.avatarText]}>
          {usuarioIniciales}
        </Text>
      </View>
      <View>
        <Text
          style={[
            tipografia.caption,
            { color: colores.tinta, fontFamily: FUENTES.semi },
          ]}
        >
          {usuarioNombre}
        </Text>
        <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
          {usuarioRol}
        </Text>
      </View>
      {onEditarUsuario ? (
        <Icon name="pencil" size={13} color={colores.acentoIntenso} />
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.topbar,
        {
          backgroundColor: colores.superficie,
          borderBottomColor: colores.borde,
        },
      ]}
    >
      {onCambiarBusqueda ? (
        <BuscadorPortal
          busqueda={busqueda}
          onCambiarBusqueda={onCambiarBusqueda}
          placeholderBusqueda={placeholderBusqueda}
        />
      ) : (
        <View style={styles.flex} />
      )}

      <View style={styles.topbarAcciones}>
        {mostrarSalir ? <BotonSalir /> : null}
        <InterruptorTema />
        {onEditarUsuario ? (
          <Pressable
            onPress={onEditarUsuario}
            accessibilityRole="button"
            accessibilityLabel={`Cambiar nombre de usuario (${usuarioNombre})`}
            style={({ pressed }) => [
              styles.topUserPill,
              {
                minHeight: puntoMinimo,
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.pill,
                cursor: "pointer",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {contenidoPill}
          </Pressable>
        ) : (
          <View
            style={[
              styles.topUserPill,
              {
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.pill,
              },
            ]}
          >
            {contenidoPill}
          </View>
        )}
      </View>
    </View>
  );
}

interface MobileHeaderProps extends DesktopHeaderProps {
  items: PortalNavItem[];
  vistaActiva: string;
  onCambiarVista: (id: string) => void;
  accionExtra?: AccionExtraPortal;
}

export function PortalHeader({
  usuarioNombre,
  usuarioRol,
  items,
  vistaActiva,
  onCambiarVista,
  accionExtra,
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda,
  mostrarSalir,
  onEditarUsuario,
}: MobileHeaderProps) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  const brandInfo = (
    <>
      <View style={styles.brandIcono}>
        <Icon name="hexagon" size={16} color="#0a0d10" />
      </View>
      <View>
        <Text style={[tipografia.etiqueta, styles.brandTitulo]}>
          ATELIER NOIR
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={[tipografia.caption, styles.brandSub]}>
            {usuarioNombre} · {usuarioRol}
          </Text>
          {onEditarUsuario ? (
            <Icon name="pencil" size={11} color="#86a6ff" />
          ) : null}
        </View>
      </View>
    </>
  );

  return (
    <>
      <View
        style={[
          styles.movilHeader,
          {
            backgroundColor: "#0a0d10",
            borderBottomColor: "#1a2029",
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.movilHeaderTop}>
          {onEditarUsuario ? (
            <Pressable
              onPress={onEditarUsuario}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar nombre de usuario (${usuarioNombre})`}
              style={({ pressed }) => [
                styles.brandHeader,
                {
                  minHeight: puntoMinimo,
                  cursor: "pointer",
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              {brandInfo}
            </Pressable>
          ) : (
            <View style={styles.brandHeader}>{brandInfo}</View>
          )}

          <View style={styles.movilAcciones}>
            {mostrarSalir ? <BotonSalir /> : null}
            <InterruptorTema />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.movilNavFila}
        >
          {items.map((item) => (
            <NavItemPortal
              key={item.id}
              item={item}
              activo={vistaActiva === item.id}
              compacto
              onPress={() => onCambiarVista(item.id)}
            />
          ))}
          {accionExtra ? (
            <Pressable
              onPress={accionExtra.onPress}
              accessibilityRole="button"
              accessibilityLabel={accionExtra.etiqueta}
              style={({ pressed }) => [
                styles.navPillExtra,
                {
                  minHeight: puntoMinimo,
                  borderRadius: RADIOS.sm,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Icon name={accionExtra.icono} size={16} color="#ffffff" />
              <Text
                style={[
                  tipografia.caption,
                  { color: "#ffffff", fontFamily: FUENTES.semi },
                ]}
              >
                {accionExtra.etiqueta}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {onCambiarBusqueda ? (
        <View
          style={[
            styles.movilSearchBar,
            {
              backgroundColor: colores.superficie,
              borderBottomColor: colores.borde,
            },
          ]}
        >
          <BuscadorPortal
            busqueda={busqueda}
            onCambiarBusqueda={onCambiarBusqueda}
            placeholderBusqueda={placeholderBusqueda}
            fullWidth
          />
        </View>
      ) : null}
    </>
  );
}
