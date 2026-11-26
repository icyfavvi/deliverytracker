// ─── Ítem de navegación reutilizable (Sidebar + Móvil) ───────────

import React from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES, RADIOS } from "../../theme/tokens";
import { PortalNavItem, portalStyles as styles } from "./estilosPortal";

interface Props {
  item: PortalNavItem;
  activo: boolean;
  compacto?: boolean;
  onPress: () => void;
}

export function NavItemPortal({
  item,
  activo,
  compacto = false,
  onPress,
}: Props) {
  const { tipografia, puntoMinimo } = useTema();

  return (
    <Pressable
      onPress={onPress}
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
          borderColor: activo ? "rgba(111, 149, 255, 0.45)" : "transparent",
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
}
