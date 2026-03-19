import * as React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { darkColors } from "@/lib/themeDark";
import type { AppNotification } from "@/lib/notificationsStorage";

function useTypeMeta() {
  const { isDark } = useTheme();
  const primary = isDark ? darkColors.primary : "#5A7A66";
  const muted = isDark ? darkColors.mutedForeground : "#6B7280";
  return React.useMemo(
    () =>
      ({
        emotional_checkin: { icon: <MaterialCommunityIcons name="heart" size={15} color={primary} />, bg: "bg-primary/10 dark:bg-dark-primary/10" },
        reflection: { icon: <MaterialCommunityIcons name="book-open" size={15} color={primary} />, bg: "bg-primary/10 dark:bg-dark-primary/10" },
        checkout: { icon: <MaterialCommunityIcons name="check-circle" size={15} color={primary} />, bg: "bg-primary/10 dark:bg-dark-primary/10" },
        challenge_phase: { icon: <MaterialCommunityIcons name="target" size={15} color={primary} />, bg: "bg-primary/15 dark:bg-dark-primary/15" },
        badge: { icon: <MaterialCommunityIcons name="trophy" size={15} color={muted} />, bg: "bg-secondary/40 dark:bg-dark-muted/40" },
        reminder: { icon: <MaterialCommunityIcons name="bell" size={15} color={primary} />, bg: "bg-primary/10 dark:bg-dark-primary/10" },
        milestone: { icon: <MaterialCommunityIcons name="star" size={15} color={muted} />, bg: "bg-secondary/30 dark:bg-dark-muted/30" },
        product: { icon: <MaterialCommunityIcons name="bullhorn" size={15} color={muted} />, bg: "bg-muted dark:bg-dark-muted" },
      }) as Record<string, { icon: React.ReactNode; bg: string }>,
    [primary, muted]
  );
}

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const byDay = new Map<string, AppNotification[]>();
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  for (const n of sorted) {
    const d = parseISO(n.created_at);
    const key = format(d, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(n);
  }
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const yesterdayKey = format(new Date(Date.now() - 864e5), "yyyy-MM-dd");
  return Array.from(byDay.entries()).map(([key, items]) => ({
    label: key === todayKey ? "Hoje" : key === yesterdayKey ? "Ontem" : format(parseISO(key), "dd/MM/yyyy", { locale: ptBR }),
    items,
  }));
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();
  const { notifications, hasUnread, markAsRead, markAllAsRead } = useNotifications();
  const iconFg = isDark ? darkColors.foreground : "#1f2937";
  const iconMuted = isDark ? darkColors.mutedForeground : "#D1D5DB";
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const typeMeta = useTypeMeta();
  const groups = React.useMemo(() => groupByDate(notifications), [notifications]);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View
        className="flex-row items-center border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-card dark:bg-dark-card items-center justify-center mr-3">
          <MaterialCommunityIcons name="chevron-left" size={20} color={iconFg} />
        </Pressable>
        <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg flex-1">
          Notificações
        </Text>
        {hasUnread ? (
          <Pressable onPress={() => markAllAsRead()} className="px-3 py-1.5">
            <Text className="text-xs font-medium text-primary dark:text-dark-primary">Marcar como lidas</Text>
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 25, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="items-center py-16">
            <MaterialCommunityIcons name="bell-outline" size={40} color={iconMuted} />
            <Text className="text-base font-serif text-foreground dark:text-dark-fg mt-4 mb-1">
              Nenhuma notificação
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg text-center">
              Você será avisado sobre reflexões, check-ins, desafios e novidades.
            </Text>
          </View>
        ) : (
          <View className="gap-6">
            {groups.map(({ label, items }) => (
              <View key={label}>
                <Text className="text-xs font-semibold text-muted-foreground dark:text-dark-muted-fg uppercase tracking-wide mb-3">
                  {label}
                </Text>
                <View className="gap-3">
                  {items.map((n) => {
                    const meta = typeMeta[n.type] ?? typeMeta.product;
                    const timeStr = format(parseISO(n.created_at), "HH:mm", { locale: ptBR });
                    return (
                      <Pressable
                        key={n.id}
                        onPress={() => !n.read && markAsRead(n.id)}
                        className={`rounded-2xl p-4 border border-border dark:border-dark-border ${
                          n.read ? "bg-card dark:bg-dark-card" : "bg-card dark:bg-dark-card border-primary/30 dark:border-dark-primary/30"
                        }`}
                      >
                        <View className="flex-row items-start gap-3">
                          <View className={`w-8 h-8 rounded-full items-center justify-center ${meta.bg}`}>
                            {meta.icon}
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between gap-2">
                              <Text className="text-sm font-semibold text-foreground dark:text-dark-fg flex-1">{n.title}</Text>
                              <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">{timeStr}</Text>
                            </View>
                            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mt-0.5">{n.message}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
