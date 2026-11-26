// ─── Tipos y estilos compartidos de PortalShell ──────────────────

import { StyleSheet } from "react-native";

import { LucideIconName } from "../Icon";
import { ESPACIOS, FUENTES, RADIOS } from "../../theme/tokens";

export interface PortalNavItem {
  id: string;
  etiqueta: string;
  icono: LucideIconName;
  badge?: number;
}

export interface AccionExtraPortal {
  etiqueta: string;
  icono: LucideIconName;
  onPress: () => void;
}

export const portalStyles = StyleSheet.create({
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
