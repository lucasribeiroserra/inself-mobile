import { View, Text, Platform, type TextProps, StyleSheet } from "react-native";

const systemFont = StyleSheet.create({
  ios: { fontFamily: "System" },
  android: { fontFamily: "sans-serif" },
});

const SIZE_MAP: Record<string, number> = {
  "text-xs": 14,
  "text-sm": 16,
  "text-base": 18,
  "text-lg": 20,
  "text-xl": 22,
  "text-2xl": 26,
  "text-3xl": 32,
  "text-4xl": 38,
};

type EmojiTextProps = TextProps & {
  /** Tamanho do emoji (evita usar className no Text para não herdar font-body). */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
};

/**
 * Renderiza emojis com fonte do sistema. Não passa className para o Text interno
 * para evitar que o NativeWind aplique font-body e quebre os emojis.
 */
export default function EmojiText({
  children,
  style,
  className,
  size = "base",
  ...props
}: EmojiTextProps) {
  const fontStyle = Platform.OS === "ios" ? systemFont.ios : systemFont.android;
  const fontSize = SIZE_MAP[`text-${size}`] ?? 18;

  const textNode = (
    <Text style={[style, { fontSize }, fontStyle]} {...props}>
      {children}
    </Text>
  );

  if (className) {
    return <View style={styles.wrapper} className={className}>{textNode}</View>;
  }

  return textNode;
}

const styles = StyleSheet.create({
  wrapper: {},
});
