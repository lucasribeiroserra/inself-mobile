/**
 * Ícone por nome (MaterialCommunityIcons). Substitui emojis em todo o app.
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";

export type AppIconSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type AppIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SIZE_MAP: Record<AppIconSize, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

type AppIconProps = {
  name: AppIconName;
  size?: AppIconSize;
  color?: string;
};

export default function AppIcon({ name, size = "base", color = "#5A7A66" }: AppIconProps) {
  return <MaterialCommunityIcons name={name} size={SIZE_MAP[size]} color={color} />;
}
