// ─── Estilos compartidos de Subvistas Admin ──────────────────────

import { StyleSheet } from "react-native";

import { ESPACIOS, RADIOS } from "../../theme/tokens";

export const adminStyles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  seccionStack: { gap: ESPACIOS.lg },
  pageHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  pageHeadLeft: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  adminBanner: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  bannerTextos: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  bannerStat: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: ESPACIOS.sm,
    borderRadius: RADIOS.md,
    backgroundColor: "rgba(62, 111, 246, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.35)",
    alignItems: "center",
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  dosColumnas: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.lg,
  },
  unaColumna: {
    gap: ESPACIOS.lg,
  },
  colMayor: { flex: 1.35, minWidth: 0 },
  colMenor: { flex: 0.9, minWidth: 0 },
  panel: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  panelHead: { gap: 2 },
  panelHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  barrasEtapa: { gap: ESPACIOS.md },
  barraRow: { gap: 6 },
  barraLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  mixFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mixIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  mixDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listaCompacta: { gap: ESPACIOS.sm },
  filaCompacta: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  btnMini: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  emptyMini: {
    padding: ESPACIOS.lg,
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  stockCriticoItem: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: 6,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  chipFiltro: {
    justifyContent: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  skuInfo: {
    flex: 1,
    minWidth: 180,
    gap: 3,
  },
  skuControles: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  pillEstadoSku: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: 5,
  },
  btnReponer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: 5,
  },
  rendimientoBox: {
    paddingTop: ESPACIOS.sm,
    gap: 4,
  },
});
