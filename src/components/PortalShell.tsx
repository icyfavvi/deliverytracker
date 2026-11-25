// ─── Shell de Portal Atelier Noir (Responsive Mobile + Tablet/Web) ─
//
// Traduce el layout del prototipo (sidebar oscuro #0a0d10 + topbar + área
// principal clara/oscura) a React Native:
//   - >= 840px (tablet/web): Sidebar fijo a la izquierda + topbar con buscador.
//   - < 840px (móvil): Cabecera oscura compacta + navegación horizontal >= 44pt.

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BotonSalir } from "./BotonSalir";
import { Icon, LucideIconName } from "./Icon";
import { InterruptorTema } from "./InterruptorTema";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";

export interface PortalNavItem {
  id: string;
  etiqueta: string;
  icono: LucideIconName;
  badge?: number;
}

interface Props {
  rolLabel: string;
  usuarioIniciales: string;
  usuarioNombre: string;
  usuarioRol: string;
  items: PortalNavItem[];
  vistaActiva: string;
  onCambiarVista: (id: string) => void;
  accionExtra?: {
    etiqueta: string;
    icono: LucideIconName;
    onPress: () => void;
  };
  busqueda?: string;
  onCambiarBusqueda?: (txt: string) => void;
  placeholderBusqueda?: string;
  mostrarSalir?: boolean;
  onEditarUsuario?: () => void;
  children: React.ReactNode;
}

export function PortalShell({
  rolLabel,
  usuarioIniciales,
  usuarioNombre,
  usuarioRol,
  items,
  vistaActiva,
  onCambiarVista,
  accionExtra,
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda = "Buscar en tu espacio…",
  mostrarSalir = true,
  onEditarUsuario,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const esDesktop = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  const renderNavItem = (item: PortalNavItem, compacto = false) => {
    const activo = vistaActiva === item.id;
    return (
      <Pressable
        key={item.id}
        onPress={() => onCambiarVista(item.id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={item.etiqueta}
        style={({ pressed }) => [
          compacto ? styles.navPillMovil : styles.navItemSidebar,
          {
            minHeight: puntoMinimo,
            borderRadius: RADIOS.sm,
            backgroundColor: activo
              ? "rgba(62, 111, 246, 0.2)"
              : compacto
                ? "rgba(255, 255, 255, 0.06)"
                : "transparent",
            borderColor: activo
              ? "rgba(111, 149, 255, 0.45)"
              : "transparent",
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <Icon
          name={item.icono}
          size={17}
          color={activo ? "#86a6ff" : "#a7b3c2"}
        />
        <Text
          style={[
            tipografia.etiqueta,
            {
              color: activo ? "#ffffff" : "#b8c2ce",
              fontFamily: activo ? FUENTES.semi : FUENTES.medio,
              flex: compacto ? undefined : 1,
            },
          ]}
          numberOfLines={1}
        >
          {item.etiqueta}
        </Text>
        {typeof item.badge === "number" && item.badge > 0 ? (
          <View style={styles.navBadge}>
            <Text style={[tipografia.caption, styles.navBadgeTexto]}>
              {item.badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  if (esDesktop) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colores.fondo }]}
        edges={["top"]}
      >
        <View style={styles.desktopRoot}>
          {/* ─── Sidebar oscuro (#0a0d10) ───────────────────────── */}
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor: "#0a0d10",
                borderRightColor: "#1a2029",
              },
            ]}
          >
            <View style={styles.brandHeader}>
              <View style={styles.brandIcono}>
                <Icon name="hexagon" size={18} color="#0a0d10" />
              </View>
              <View>
                <Text style={[tipografia.etiqueta, styles.brandTitulo]}>
                  ATELIER NOIR
                </Text>
                <Text style={[tipografia.caption, styles.brandSub]}>
                  STREETWEAR / CHILE
                </Text>
              </View>
            </View>

            <Text style={[tipografia.caption, styles.sidebarSectionLabel]}>
              {rolLabel.toUpperCase()}
            </Text>

            <View style={styles.sidebarNav}>
              {items.map((item) => renderNavItem(item, false))}

              {accionExtra ? (
                <Pressable
                  onPress={accionExtra.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={accionExtra.etiqueta}
                  style={({ pressed }) => [
                    styles.navItemExtra,
                    {
                      minHeight: puntoMinimo,
                      borderRadius: RADIOS.sm,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Icon name={accionExtra.icono} size={17} color="#ffffff" />
                  <Text
                    style={[
                      tipografia.etiqueta,
                      { color: "#ffffff", fontFamily: FUENTES.semi },
                    ]}
                  >
                    {accionExtra.etiqueta}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Footer usuario + soporte */}
            <View style={styles.sidebarFooter}>
              <View style={styles.helpBox}>
                <Text style={[tipografia.caption, { color: "#ffffff", fontFamily: FUENTES.semi }]}>
                  ¿Necesitas ayuda?
                </Text>
                <Text style={[tipografia.caption, { color: "#9aa6b4" }]}>
                  Operación Santiago RM · 24/7
                </Text>
              </View>

              <View style={styles.userMini}>
                <View style={styles.avatar}>
                  <Text style={[tipografia.caption, styles.avatarText]}>
                    {usuarioIniciales}
                  </Text>
                </View>
                <View style={styles.userMiniInfo}>
                  <Text
                    style={[tipografia.caption, { color: "#ffffff", fontFamily: FUENTES.semi }]}
                    numberOfLines={1}
                  >
                    {usuarioNombre}
                  </Text>
                  <Text
                    style={[tipografia.caption, { color: "#9aa6b4" }]}
                    numberOfLines={1}
                  >
                    {usuarioRol}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Área principal con topbar ──────────────────────── */}
          <View style={styles.mainDesktop}>
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
                <View
                  style={[
                    styles.searchWrap,
                    {
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                      minHeight: puntoMinimo,
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
                    <View style={styles.avatarSm}>
                      <Text style={[tipografia.caption, styles.avatarText]}>
                        {usuarioIniciales}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[tipografia.caption, { color: colores.tinta, fontFamily: FUENTES.semi }]}
                      >
                        {usuarioNombre}
                      </Text>
                      <Text
                        style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                      >
                        {usuarioRol}
                      </Text>
                    </View>
                    <Icon name="pencil" size={13} color={colores.acentoIntenso} />
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
                    <View style={styles.avatarSm}>
                      <Text style={[tipografia.caption, styles.avatarText]}>
                        {usuarioIniciales}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[tipografia.caption, { color: colores.tinta, fontFamily: FUENTES.semi }]}
                      >
                        {usuarioNombre}
                      </Text>
                      <Text
                        style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                      >
                        {usuarioRol}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.flex}>{children}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Layout Móvil (< 840px) ────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
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
                { minHeight: puntoMinimo, cursor: "pointer", opacity: pressed ? 0.78 : 1 },
              ]}
            >
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
                  <Icon name="pencil" size={11} color="#86a6ff" />
                </View>
              </View>
            </Pressable>
          ) : (
            <View style={styles.brandHeader}>
              <View style={styles.brandIcono}>
                <Icon name="hexagon" size={16} color="#0a0d10" />
              </View>
              <View>
                <Text style={[tipografia.etiqueta, styles.brandTitulo]}>
                  ATELIER NOIR
                </Text>
                <Text style={[tipografia.caption, styles.brandSub]}>
                  {usuarioNombre} · {usuarioRol}
                </Text>
              </View>
            </View>
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
          {items.map((item) => renderNavItem(item, true))}
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
          <View
            style={[
              styles.searchWrap,
              {
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.sm,
                minHeight: puntoMinimo,
                maxWidth: undefined,
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
        </View>
      ) : null}

      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 244,
    borderRightWidth: 1,
    padding: ESPACIOS.lg,
    justifyContent: "space-between",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm + 2,
  },
  brandIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitulo: {
    color: "#ffffff",
    letterSpacing: 1.4,
  },
  brandSub: {
    color: "#9aa6b4",
    letterSpacing: 0.6,
  },
  sidebarSectionLabel: {
    color: "#8e9aa8",
    letterSpacing: 1.4,
    marginTop: ESPACIOS.xl,
    marginBottom: ESPACIOS.sm,
  },
  sidebarNav: {
    flex: 1,
    gap: ESPACIOS.xs,
  },
  navItemSidebar: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  navItemExtra: {
    marginTop: ESPACIOS.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm + 2,
    paddingHorizontal: ESPACIOS.md,
    backgroundColor: "#244dcc",
    cursor: "pointer",
  },
  navBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.pill,
    backgroundColor: "rgba(62, 111, 246, 0.25)",
    alignItems: "center",
  },
  navBadgeTexto: {
    color: "#c7d6ff",
    fontFamily: FUENTES.monoBold,
  },
  sidebarFooter: {
    gap: ESPACIOS.md,
    marginTop: ESPACIOS.lg,
  },
  helpBox: {
    padding: ESPACIOS.md,
    borderRadius: RADIOS.md,
    backgroundColor: "#141920",
    borderWidth: 1,
    borderColor: "#222a35",
    gap: 2,
  },
  userMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingTop: ESPACIOS.sm,
    borderTopWidth: 1,
    borderTopColor: "#1d242f",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#244dcc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#244dcc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontFamily: FUENTES.monoBold,
  },
  userMiniInfo: {
    flex: 1,
    minWidth: 0,
  },
  mainDesktop: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ESPACIOS.xl,
    paddingVertical: ESPACIOS.md,
    borderBottomWidth: 1,
    gap: ESPACIOS.md,
  },
  searchWrap: {
    flex: 1,
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingLeft: ESPACIOS.md,
    paddingRight: ESPACIOS.xs,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: ESPACIOS.xs + 2,
  },
  topbarAcciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  topUserPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: ESPACIOS.md,
    borderWidth: 1,
  },
  movilHeader: {
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.md,
    paddingBottom: ESPACIOS.sm,
    borderBottomWidth: 1,
    gap: ESPACIOS.sm,
  },
  movilHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
  },
  movilAcciones: {
    flexDirection: "row",
    alignItems: "center",
  },
  movilNavFila: {
    gap: ESPACIOS.xs + 2,
    paddingVertical: 2,
  },
  navPillMovil: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  navPillExtra: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    backgroundColor: "#244dcc",
    cursor: "pointer",
  },
  movilSearchBar: {
    paddingHorizontal: ESPACIOS.lg,
    paddingVertical: ESPACIOS.sm,
    borderBottomWidth: 1,
  },
});
