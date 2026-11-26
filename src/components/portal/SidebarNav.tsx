// ─── Sidebar Desktop de Portal Atelier Noir ──────────────────────

import React from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES, RADIOS } from "../../theme/tokens";
import {
  AccionExtraPortal,
  PortalNavItem,
  portalStyles as styles,
} from "./estilosPortal";
import { NavItemPortal } from "./NavItemPortal";

interface Props {
  rolLabel: string;
  usuarioIniciales: string;
  usuarioNombre: string;
  usuarioRol: string;
  items: PortalNavItem[];
  vistaActiva: string;
  onCambiarVista: (id: string) => void;
  accionExtra?: AccionExtraPortal;
}

export function SidebarNav({
  rolLabel,
  usuarioIniciales,
  usuarioNombre,
  usuarioRol,
  items,
  vistaActiva,
  onCambiarVista,
  accionExtra,
}: Props) {
  const { tipografia, puntoMinimo } = useTema();

  return (
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
        {items.map((item) => (
          <NavItemPortal
            key={item.id}
            item={item}
            activo={vistaActiva === item.id}
            onPress={() => onCambiarVista(item.id)}
          />
        ))}

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

      <View style={styles.sidebarFooter}>
        <View style={styles.helpBox}>
          <Text
            style={[
              tipografia.caption,
              { color: "#ffffff", fontFamily: FUENTES.semi },
            ]}
          >
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
              style={[
                tipografia.caption,
                { color: "#ffffff", fontFamily: FUENTES.semi },
              ]}
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
  );
}
