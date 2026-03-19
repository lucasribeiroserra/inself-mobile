import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { getCurrentBadge } from "@/lib/badges";
import { darkColors } from "@/lib/themeDark";
import { useRouter } from "expo-router";
import AppIcon from "./AppIcon";
import { useSettings } from "@/contexts/SettingsContext";

const PRIMARY = "#5A7A66";

export default function TopHeader() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { checkinCount } = useAuth();
  const { hasUnread } = useNotifications();
  const router = useRouter();
  const { language } = useSettings();
  const badge = getCurrentBadge(checkinCount, language);
  const iconPrimary = isDark ? darkColors.primary : PRIMARY;

  return (
    <View
      className="flex-row items-center justify-between px-5 border-b border-border bg-background/95 dark:bg-dark-bg/95 dark:border-dark-border"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
    >
      <View className="flex-row items-center gap-2">
        <Text className="font-serif text-lg font-bold text-foreground dark:text-dark-primary tracking-wide">InSelf</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {badge && (
          <View className="flex-row items-center gap-1.5 bg-card dark:bg-dark-card px-3 py-1.5 rounded-full border border-border dark:border-dark-border">
            <AppIcon name={badge.icon as any} size="base" color={iconPrimary} />
            <Text className="text-xs font-semibold text-foreground dark:text-dark-fg">{badge.name}</Text>
          </View>
        )}
        <Pressable onPress={() => router.push("/(tabs)/notifications")} className="p-2 rounded-full">
          <MaterialCommunityIcons name={hasUnread ? "bell" : "bell-outline"} size={20} color={iconPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
