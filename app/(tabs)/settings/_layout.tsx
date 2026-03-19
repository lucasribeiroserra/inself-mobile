import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account-details" options={{ presentation: "card" }} />
      <Stack.Screen name="reminder-time" options={{ presentation: "card" }} />
    </Stack>
  );
}
