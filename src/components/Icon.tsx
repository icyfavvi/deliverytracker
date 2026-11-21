// ─── Icono (Lucide) ──────────────────────────────────────────────
//
// Un único punto de entrada a la iconografía. Nadie escribe <Text>🚚</Text>
// ni pega SVG suelto: se pide un nombre de Lucide y se pinta con el color
// del tema. Así el set es coherente y el color cambia con el modo.

import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { Lucide, LucideIconName } from "@react-native-vector-icons/lucide";

export type { LucideIconName };

interface Props {
  name: LucideIconName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 18, color, style }: Props) {
  return <Lucide name={name} size={size} color={color} style={style} />;
}
