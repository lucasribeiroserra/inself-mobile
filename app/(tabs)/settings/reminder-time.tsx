import * as React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { darkColors } from "@/lib/themeDark";

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 7, m ?? 0, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ReminderTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { reminder_time, updateSettings, language } = useSettings();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconFg = isDark ? darkColors.foreground : "#1f2937";

  const [time, setTime] = React.useState(() => parseTime(reminder_time));
  const [showPicker, setShowPicker] = React.useState(Platform.OS === "ios");
  const [saving, setSaving] = React.useState(false);

  const handleChange = React.useCallback(
    (_: unknown, date?: Date) => {
      if (Platform.OS === "android") setShowPicker(false);
      if (date) {
        setTime(date);
        const timeStr = formatTime(date);
        setSaving(true);
        updateSettings({ reminder_time: timeStr }).finally(() => setSaving(false));
      }
    },
    [updateSettings]
  );

  const handleSave = React.useCallback(() => {
    const timeStr = formatTime(time);
    setSaving(true);
    updateSettings({ reminder_time: timeStr }).then(() => router.back()).finally(() => setSaving(false));
  }, [time, updateSettings, router]);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View
        className="flex-row items-center gap-3 border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 16 }}
      >
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-card dark:bg-dark-card items-center justify-center">
          <MaterialCommunityIcons name="chevron-left" size={20} color={iconFg} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg">
            {language === "en" ? "Reminder time" : "Horário do Lembrete"}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg">
            {language === "en"
              ? "Get a daily notification with the reflection"
              : "Receba uma notificação diária com a reflexão"}
          </Text>
        </View>
      </View>

      <View className="p-6">
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mb-3">
          {language === "en"
            ? "Choose the time to receive the push with today’s reflection (if daily reminders are enabled)."
            : "Escolha o horário para receber o push com a reflexão do dia (se o lembrete diário estiver ligado)."}
        </Text>

        {Platform.OS === "android" && (
          <Pressable
            onPress={() => setShowPicker(true)}
            className="bg-card dark:bg-dark-card rounded-2xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-base text-foreground dark:text-dark-fg">{formatTime(time)}</Text>
            <MaterialCommunityIcons name="clock-outline" size={24} color={iconPrimary} />
          </Pressable>
        )}

        {showPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            themeVariant={isDark ? "dark" : "light"}
          />
        )}

        {Platform.OS === "ios" && (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="mt-6 py-3 rounded-full bg-primary dark:bg-dark-primary items-center"
          >
            <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
              {saving ? (language === "en" ? "Saving…" : "Salvando…") : language === "en" ? "Save time" : "Salvar horário"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
