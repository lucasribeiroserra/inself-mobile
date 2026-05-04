import { Tabs } from "expo-router";
import { NAV_ICONS } from "@/lib/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { darkColors } from "@/lib/themeDark";
import { lightColors } from "@/lib/themeLight";

const iconSize = 20;
const iconProps = (focused: boolean) => ({ strokeWidth: focused ? 2.2 : 1.5 });

export default function TabLayout() {
  const { isDark } = useTheme();
  const { language } = useSettings();
  const { Home, Clock, Swords, Sparkles, User } = NAV_ICONS;
  const tabColors = isDark
    ? {
        activeTint: darkColors.primary,
        inactiveTint: darkColors.mutedForeground,
        background: "rgba(26, 29, 36, 0.98)",
        border: darkColors.border,
      }
    : {
        activeTint: lightColors.tabActive,
        inactiveTint: lightColors.mutedForeground,
        background: lightColors.background,
        border: lightColors.border,
      };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabColors.activeTint,
        tabBarInactiveTintColor: tabColors.inactiveTint,
        tabBarStyle: {
          backgroundColor: tabColors.background,
          borderTopColor: tabColors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500", letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: language === "en" ? "Home" : "Início",
          tabBarIcon: ({ color, focused }) => <Home size={iconSize} color={color} strokeWidth={iconProps(focused).strokeWidth} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: language === "en" ? "Challenges" : "Desafios",
          tabBarIcon: ({ color, focused }) => <Swords size={iconSize} color={color} strokeWidth={iconProps(focused).strokeWidth} />,
        }}
      />
      <Tabs.Screen
        name="virtues"
        options={{
          title: language === "en" ? "Virtues" : "Virtudes",
          tabBarIcon: ({ color, focused }) => <Sparkles size={iconSize} color={color} strokeWidth={iconProps(focused).strokeWidth} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: language === "en" ? "History" : "Histórico",
          tabBarIcon: ({ color, focused }) => <Clock size={iconSize} color={color} strokeWidth={iconProps(focused).strokeWidth} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: language === "en" ? "Profile" : "Perfil",
          tabBarIcon: ({ color, focused }) => <User size={iconSize} color={color} strokeWidth={iconProps(focused).strokeWidth} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
