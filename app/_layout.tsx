import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ReflectionsProvider } from "@/contexts/ReflectionsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PushNotificationRegistration } from "@/components/PushNotificationRegistration";
import { NotificationReceivedListener } from "@/components/NotificationReceivedListener";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular,
} from "@expo-google-fonts/cormorant-garamond";
import { DMSans_300Light, DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";

SplashScreen.preventAutoHideAsync();

function StatusBarByTheme() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_400Regular,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ReflectionsProvider>
            <NotificationsProvider>
            <NotificationReceivedListener />
            <PushNotificationRegistration />
            <StatusBarByTheme />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="challenges" options={{ headerShown: false }} />
            </Stack>
          </NotificationsProvider>
          </ReflectionsProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
