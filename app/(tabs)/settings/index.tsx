import * as React from "react";
import { View, Text, ScrollView, Pressable, Image, Modal } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { darkColors } from "@/lib/themeDark";
import { registerForPushNotificationsAsync } from "@/lib/registerPushNotifications";
import { BADGES, getEarnedBadges, getCheckinCount } from "@/lib/badges";
import { ALL_CATEGORIES, getCategoryLabel, type ReflectionCategory } from "@/lib/dailyReflections";
import TopHeader from "@/components/TopHeader";
import AppIcon from "@/components/AppIcon";
import Switch from "@/components/Switch";

const CATEGORY_ICONS: Record<ReflectionCategory, string> = {
  anxiety: "lightning-bolt",
  stress: "yoga",
  "self-love": "heart",
  discipline: "sword-cross",
  purpose: "compass",
  relationships: "handshake",
  resilience: "fire",
  "mental-clarity": "diamond",
};

const FREE_FEATURES = [
  "1 reflexão guiada por dia",
  "Jornada de reflexão: Identifique • Aceite • Aja",
  "Check-in emocional diário",
  "Histórico de reflexões",
  "Reflexões favoritas",
  "Sistema de badges",
  "Selecione até 3 categorias de desenvolvimento",
];

const FREE_FEATURES_EN = [
  "1 guided reflection per day",
  "Reflection journey: Identify • Accept • Act",
  "Daily emotional check-in",
  "Reflection history",
  "Saved reflections",
  "Badges system",
  "Select up to 3 development categories",
];

const PREMIUM_FEATURES = [
  "Reflexões ilimitadas por dia",
  "Todas as categorias de reflexão",
  "Desafios filosóficos guiados",
  "Trilhas de desenvolvimento pessoal",
  "Insights emocionais avançados",
  "Progresso detalhado de virtudes",
  "Experiência sem anúncios",
];

const PREMIUM_FEATURES_EN = [
  "Unlimited reflections per day",
  "All reflection categories",
  "Guided philosophical challenges",
  "Personal development paths",
  "Advanced emotional insights",
  "Detailed virtue progress",
  "Ad-free experience",
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, checkinCount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { reminder_enabled, reminder_time, preferred_category_slugs, language, updateSettings, updatePushToken } = useSettings();
  const freeFeatures = language === "en" ? FREE_FEATURES_EN : FREE_FEATURES;
  const premiumFeatures = language === "en" ? PREMIUM_FEATURES_EN : PREMIUM_FEATURES;
  const [activeTab, setActiveTab] = React.useState<"geral" | "insights">("geral");
  const [earnedBadges, setEarnedBadges] = React.useState<ReturnType<typeof getEarnedBadges>>([]);
  const [categorySheetVisible, setCategorySheetVisible] = React.useState(false);
  const [tempPreferredCategories, setTempPreferredCategories] = React.useState<ReflectionCategory[]>([]);
  const [savingCategories, setSavingCategories] = React.useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = React.useState(false);
  const [tempLanguage, setTempLanguage] = React.useState<"pt" | "en">(language);
  const [savingLanguage, setSavingLanguage] = React.useState(false);

  React.useEffect(() => {
    getCheckinCount().then((c) => setEarnedBadges(getEarnedBadges(c)));
  }, [checkinCount]);

  // Sempre que abrir o Perfil, tenta obter e enviar o token de push (para quando o projectId for configurado)
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync(language);
      if (!cancelled && token) await updatePushToken(token);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, updatePushToken]);

  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    (language === "en" ? "User" : "Usuário");

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  const openCategorySheet = () => {
    setTempPreferredCategories(preferred_category_slugs);
    setSavingCategories(false);
    setCategorySheetVisible(true);
  };

  const closeCategorySheet = () => {
    setCategorySheetVisible(false);
    setSavingCategories(false);
    setTempPreferredCategories(preferred_category_slugs);
  };

  const openLanguageSheet = () => {
    setTempLanguage(language);
    setSavingLanguage(false);
    setLanguageSheetVisible(true);
  };

  const closeLanguageSheet = () => {
    setLanguageSheetVisible(false);
    setSavingLanguage(false);
    setTempLanguage(language);
  };

  const toggleTempCategory = (cat: ReflectionCategory) => {
    setTempPreferredCategories((prev) => {
      const isSelected = prev.includes(cat);
      if (isSelected) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev; // limite fixo: desabilita seleções extras na UI
      return [...prev, cat];
    });
  };

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <TopHeader />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 25,
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
      >
        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg">
          {language === "en" ? "Profile" : "Perfil"}
        </Text>

        {/* Profile card - igual Virtus */}
        <View className="mt-6 bg-card dark:bg-dark-card rounded-3xl p-6 flex-row items-center gap-4 mb-6">
          <View className="w-14 h-14 rounded-full bg-primary/15 dark:bg-dark-primary/15 items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons name="account" size={28} color={iconPrimary} />
            )}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground dark:text-dark-fg">{displayName}</Text>
            <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg truncate" numberOfLines={1}>
              {user?.email ?? "demo@inself.app"}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <MaterialCommunityIcons name="fire" size={12} color={iconPrimary} />
              <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
                  {checkinCount}{" "}
                  {language === "en" ? (checkinCount === 1 ? "reflection" : "reflections") : checkinCount === 1 ? "reflexão" : "reflexões"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs Geral / Insights - igual Virtus */}
        <View className="flex-row bg-card dark:bg-dark-card rounded-2xl p-1 mb-4">
          <Pressable
            onPress={() => setActiveTab("geral")}
            className={`flex-1 py-2.5 rounded-xl ${activeTab === "geral" ? "bg-primary dark:bg-dark-primary" : ""}`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "geral" ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
              }`}
            >
              {language === "en" ? "General" : "Geral"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("insights")}
            className={`flex-1 py-2.5 rounded-xl ${activeTab === "insights" ? "bg-primary dark:bg-dark-primary" : ""}`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "insights" ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
              }`}
            >
              Insights
            </Text>
          </Pressable>
        </View>

        {activeTab === "geral" && (
          <>
            {/* Detalhes da Conta - igual Virtus (primeiro item) */}
            <Pressable
              onPress={() => router.push("/(tabs)/settings/account-details")}
              className="bg-card dark:bg-dark-card rounded-3xl p-5 flex-row items-center justify-between mb-6"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-dark-primary/10 items-center justify-center">
                  <MaterialCommunityIcons name="account" size={16} color={iconPrimary} />
                </View>
                <View>
                  <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                    {language === "en" ? "Account Details" : "Detalhes da Conta"}
                  </Text>
                  <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
                    {language === "en" ? "Name, email, password and more" : "Nome, email, senha e mais"}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={iconMuted} />
            </Pressable>

            {/* Badges - igual Virtus (grid 4 colunas) */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="medal" size={14} color={iconPrimary} />
                  <Text className="text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-muted-fg font-semibold">
                    Badges
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
                  {language === "en"
                    ? `${earnedBadges.length}/${BADGES.length} earned`
                    : `${earnedBadges.length}/${BADGES.length} conquistados`}
                </Text>
              </View>
              <View className="bg-card dark:bg-dark-card rounded-3xl p-5">
                <View className="flex-row flex-wrap gap-3" style={{ marginHorizontal: -4 }}>
                  {BADGES.map((badge) => {
                    const earned = checkinCount >= badge.requiredCheckins;
                    return (
                      <View
                        key={badge.id}
                        className={`items-center p-2 rounded-2xl flex-1 min-w-[22%] ${earned ? "bg-primary/10 dark:bg-dark-primary/10" : "bg-muted/50 dark:bg-dark-muted/50"}`}
                      >
                        <View className="mb-1" style={{ opacity: earned ? 1 : 0.3 }}>
                          {earned ? (
                            <AppIcon name={badge.icon as any} size="2xl" color={iconPrimary} />
                          ) : (
                            <MaterialCommunityIcons name="lock" size={18} color={iconMuted} />
                          )}
                        </View>
                        <Text
                          className={`text-[12px] font-semibold leading-tight text-center ${
                            earned ? "text-foreground dark:text-dark-fg" : "text-muted-foreground/50 dark:text-dark-muted-fg/50"
                          }`}
                          numberOfLines={1}
                        >
                          {badge.name}
                        </Text>
                        <Text
                          className={`text-[10px] mt-0.5 ${earned ? "text-primary dark:text-dark-primary" : "text-muted-foreground/40 dark:text-dark-muted-fg/40"}`}
                        >
                          {badge.requiredCheckins} dias
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {checkinCount > 0 && (
                  <Text className="text-center text-[12px] text-muted-foreground dark:text-dark-muted-fg mt-3">
                    {checkinCount} {checkinCount === 1 ? "reflexão" : "reflexões"} completadas
                  </Text>
                )}
              </View>
            </View>

            {/* Categorias preferidas - igual Virtus */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="sparkles" size={14} color={iconPrimary} />
                  <Text className="text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-muted-fg font-semibold">
                    Categorias Preferidas
                  </Text>
                </View>
                <Pressable onPress={openCategorySheet}>
                  <Text className="text-xs font-medium text-primary dark:text-dark-primary">Editar</Text>
                </Pressable>
              </View>
              <View className="bg-card dark:bg-dark-card rounded-3xl p-5">
                {preferred_category_slugs.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {preferred_category_slugs.map((cat) => (
                      <View
                        key={cat}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-dark-primary/10"
                      >
                        <AppIcon name={CATEGORY_ICONS[cat] as any} size="sm" color={iconPrimary} />
                        <Text className="text-xs font-medium text-primary dark:text-dark-primary">{getCategoryLabel(cat, language)}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg text-center">
                    {language === "en" ? "No category selected" : "Nenhuma categoria selecionada"}
                  </Text>
                )}
              </View>
            </View>

            {/* Bottom sheet de categorias preferidas */}
            <Modal
              visible={categorySheetVisible}
              transparent
              animationType="slide"
              onRequestClose={closeCategorySheet}
            >
              <Pressable
                className="flex-1 bg-black/40 justify-end"
                onPress={closeCategorySheet}
              >
                <Pressable
                  className="bg-background dark:bg-dark-bg rounded-t-3xl p-6 pb-8"
                  onPress={(e) => e.stopPropagation()}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg">
                      {language === "en" ? "Select up to 3 categories" : "Selecione até 3 categorias"}
                    </Text>
                    <Pressable onPress={closeCategorySheet} className="p-2">
                      <MaterialCommunityIcons name="close" size={20} color={iconMuted} />
                    </Pressable>
                  </View>

                  <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg mb-4">
                    {language === "en" ? "This customizes your reflection messages." : "Isso personaliza as mensagens da reflexão."}
                  </Text>

                  <View className="gap-2 mb-6">
                    {ALL_CATEGORIES.map((cat) => {
                      const selected = tempPreferredCategories.includes(cat);
                      const locked = !selected && tempPreferredCategories.length >= 3;
                      const rightIcon = selected ? "check-circle" : locked ? "lock" : "plus-circle-outline";
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => {
                            if (locked) return;
                            toggleTempCategory(cat);
                          }}
                          disabled={locked}
                          className={`flex-row items-center justify-between px-4 py-3 rounded-2xl ${
                            selected
                              ? "bg-primary/15 border border-primary dark:bg-dark-card dark:border-dark-border"
                              : "bg-card dark:bg-dark-card"
                          } ${locked ? "opacity-50" : ""}`}
                        >
                          <View className="flex-row items-center gap-3">
                            <AppIcon
                              name={CATEGORY_ICONS[cat] as any}
                              size="sm"
                              color={selected ? iconPrimary : iconMuted}
                            />
                            <Text className={`text-sm font-medium ${selected ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-fg"}`}>
                              {getCategoryLabel(cat, language)}
                            </Text>
                          </View>
                          <MaterialCommunityIcons name={rightIcon as any} size={18} color={selected ? iconPrimary : iconMuted} />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={closeCategorySheet}
                      disabled={savingCategories}
                      className="flex-1 bg-card dark:bg-dark-card rounded-2xl py-3 items-center justify-center"
                    >
                      <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                        {language === "en" ? "Cancel" : "Cancelar"}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={savingCategories}
                      onPress={async () => {
                        setSavingCategories(true);
                        try {
                          await updateSettings({
                            preferred_category_slugs: tempPreferredCategories.slice(0, 3),
                          });
                        } finally {
                          closeCategorySheet();
                        }
                      }}
                      className="flex-1 bg-primary dark:bg-dark-primary rounded-2xl py-3 items-center justify-center"
                      style={{ opacity: savingCategories ? 0.6 : 1 }}
                    >
                      <Text className="text-sm font-semibold text-primary-foreground dark:text-dark-primary-fg">
                        {language === "en" ? "Done" : "Concluir"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Bottom sheet de idioma */}
            <Modal
              visible={languageSheetVisible}
              transparent
              animationType="slide"
              onRequestClose={closeLanguageSheet}
            >
              <Pressable
                className="flex-1 bg-black/40 justify-end"
                onPress={closeLanguageSheet}
              >
                <Pressable
                  className="bg-background dark:bg-dark-bg rounded-t-3xl p-6 pb-8"
                  onPress={(e) => e.stopPropagation()}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg">
                      {language === "en" ? "Choose language" : "Selecione o idioma"}
                    </Text>
                    <Pressable onPress={closeLanguageSheet} className="p-2">
                      <MaterialCommunityIcons name="close" size={20} color={iconMuted} />
                    </Pressable>
                  </View>

                  <View className="gap-2 mb-6">
                    {(["pt", "en"] as const).map((lang) => {
                      const selected = tempLanguage === lang;
                      const label = lang === "en" ? "English" : "Português";
                      return (
                        <Pressable
                          key={lang}
                          onPress={() => setTempLanguage(lang)}
                          className={`flex-row items-center justify-between px-4 py-3 rounded-2xl ${
                            selected
                              ? "bg-primary/15 border border-primary dark:bg-dark-card dark:border-dark-border"
                              : "bg-card dark:bg-dark-card"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-fg"
                            }`}
                          >
                            {label}
                          </Text>
                          {selected ? (
                            <MaterialCommunityIcons name="check-circle" size={18} color={iconPrimary} />
                          ) : (
                            <MaterialCommunityIcons name="circle-outline" size={18} color={iconMuted} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={closeLanguageSheet}
                      disabled={savingLanguage}
                      className="flex-1 bg-card dark:bg-dark-card rounded-2xl py-3 items-center justify-center"
                    >
                      <Text className="text-sm font-medium text-foreground dark:text-dark-fg">Cancelar</Text>
                    </Pressable>
                    <Pressable
                      disabled={savingLanguage}
                      onPress={async () => {
                        setSavingLanguage(true);
                        try {
                          await updateSettings({ language: tempLanguage });
                        } finally {
                          closeLanguageSheet();
                        }
                      }}
                      className="flex-1 bg-primary dark:bg-dark-primary rounded-2xl py-3 items-center justify-center"
                      style={{ opacity: savingLanguage ? 0.6 : 1 }}
                    >
                      <Text className="text-sm font-semibold text-primary-foreground dark:text-dark-primary-fg">
                        {language === "en" ? "Save" : "Salvar"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Settings group - um único card com divisórias, igual Virtus */}
            <View className="bg-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
              <Pressable className="flex-row items-center justify-between p-5" onPress={() => router.push("/(tabs)/settings/reminder-time")}>
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-dark-primary/10 items-center justify-center">
                    <MaterialCommunityIcons name="clock-outline" size={16} color={iconPrimary} />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                      {language === "en" ? "Notification time" : "Horário da Notificação"}
                    </Text>
                    <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">{reminder_time}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color={iconMuted} />
              </Pressable>
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-dark-primary/10 items-center justify-center">
                    <MaterialCommunityIcons name="bell-outline" size={16} color={iconPrimary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                    {language === "en" ? "Daily reminder" : "Lembrete Diário"}
                  </Text>
                </View>
                <Switch value={reminder_enabled} onValueChange={(v) => updateSettings({ reminder_enabled: v })} />
              </View>
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-dark-primary/10 items-center justify-center">
                    <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={iconPrimary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                    {language === "en" ? "Dark mode" : "Modo Escuro"}
                  </Text>
                </View>
                <Switch value={isDark} onValueChange={() => toggleTheme()} />
              </View>
              <Pressable className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-dark-primary/10 items-center justify-center">
                    <MaterialCommunityIcons name="earth" size={16} color={iconPrimary} />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                      {language === "en" ? "Language" : "Idioma"}
                    </Text>
                    <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
                      {language === "en" ? "English" : "Português"}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={openLanguageSheet} className="p-2">
                  <MaterialCommunityIcons name="chevron-right" size={16} color={iconMuted} />
                </Pressable>
              </Pressable>
            </View>

            {/* Assinatura - igual Virtus: Free + Premium */}
            <View className="mb-6">
              <Text className="text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-muted-fg font-semibold mb-3 px-1">
                {language === "en" ? "Subscription" : "Assinatura"}
              </Text>

              <View className="bg-card dark:bg-dark-card rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-sm font-serif font-semibold text-foreground dark:text-dark-fg">
                      {language === "en" ? "InSelf Free" : "InSelf Free"}
                    </Text>
                    <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg mt-0.5">
                      {language === "en" ? "Practice daily reflection." : "Pratique a reflexão diária."}
                    </Text>
                  </View>
                  <View className="bg-primary/10 dark:bg-dark-primary/10 px-2.5 py-1 rounded-full">
                    <Text className="text-[12px] uppercase tracking-wider font-semibold text-primary dark:text-dark-primary">
                      {language === "en" ? "Current" : "Atual"}
                    </Text>
                  </View>
                </View>
                <View className="gap-2">
                  {freeFeatures.map((feature) => (
                    <View key={feature} className="flex-row items-start gap-2.5">
                      <MaterialCommunityIcons name="check" size={14} color={iconPrimary} style={{ marginTop: 2 }} />
                      <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg flex-1">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-primary/5 dark:bg-dark-primary/5 rounded-3xl p-5 border-2 border-primary/20 dark:border-dark-primary/20 relative">
                <View className="absolute -top-3 left-1/2" style={{ transform: [{ translateX: -40 }] }}>
                  <View className="bg-primary dark:bg-dark-primary px-3 py-1 rounded-full">
                    <Text className="text-[12px] uppercase tracking-wider font-bold text-primary-foreground dark:text-dark-primary-fg">
                      Premium
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mb-1 mt-1">
                  <Text className="text-sm font-serif font-semibold text-foreground dark:text-dark-fg">
                    {language === "en" ? "InSelf Premium" : "InSelf Premium"}
                  </Text>
                  <Text className="text-sm font-bold text-primary dark:text-dark-primary">
                    R$9,90<Text className="text-[12px] font-normal text-muted-foreground dark:text-dark-muted-fg">/mês</Text>
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg mb-4">
                {language === "en" ? "Deepen your self-knowledge practice." : "Aprofunde sua prática do auto conhecimento."}
                </Text>
                <View className="gap-2 mb-5">
                  {premiumFeatures.map((feature) => (
                    <View key={feature} className="flex-row items-start gap-2.5">
                      <MaterialCommunityIcons name="sparkles" size={14} color={iconPrimary} style={{ marginTop: 2 }} />
                      <Text className="text-xs text-foreground dark:text-dark-fg flex-1">{feature}</Text>
                    </View>
                  ))}
                </View>
                <Pressable className="bg-primary dark:bg-dark-primary rounded-2xl py-3 items-center">
                <Text className="text-sm font-semibold text-primary-foreground dark:text-dark-primary-fg">
                  {language === "en" ? "Start InSelf Premium" : "Começar InSelf Premium"}
                </Text>
                </Pressable>
              </View>
            </View>

            {/* Widget preview - igual Virtus */}
            <View className="mb-6">
              <Text className="text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-muted-fg font-semibold mb-3 px-1">
                {language === "en" ? "Widget preview" : "Prévia do Widget"}
              </Text>
              <View className="bg-card dark:bg-dark-card rounded-3xl p-5 border border-border dark:border-dark-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-5 h-5 rounded bg-primary/20 dark:bg-dark-primary/20 items-center justify-center">
                    <MaterialCommunityIcons name="eye" size={12} color={iconPrimary} />
                  </View>
                  <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg font-medium uppercase tracking-wide">
                    InSelf
                  </Text>
                </View>
                <Text className="text-sm font-serif text-foreground dark:text-dark-fg leading-relaxed italic">
                {language === "en"
                  ? "“Don’t lose more time discussing what a good man should be. Be one.”"
                  : "“Não perca mais tempo discutindo como um bom homem deve ser. Seja um.”"}
                </Text>
                <Text className="text-[12px] text-muted-foreground/60 dark:text-dark-muted-fg/60 mt-2 uppercase tracking-wide">
                  — Marcus Aurelius
                </Text>
              </View>
            </View>

            {/* Iniciar tour - igual Virtus (rounded-3xl p-4) */}
            <Pressable
              onPress={() => router.push("/(tabs)/history")}
              className="bg-card dark:bg-dark-card rounded-3xl p-4 flex-row items-center justify-center gap-2 mb-3"
            >
              <MaterialCommunityIcons name="navigation" size={16} color={iconPrimary} />
              <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                {language === "en" ? "Start tour" : "Iniciar tour"}
              </Text>
            </Pressable>

            {/* Sair da conta - igual Virtus */}
            <Pressable
              onPress={handleSignOut}
              className="bg-card dark:bg-dark-card rounded-3xl p-4 flex-row items-center justify-center gap-2"
            >
              <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
              <Text className="text-sm font-medium text-destructive">
                {language === "en" ? "Sign out" : "Sair da conta"}
              </Text>
            </Pressable>
          </>
        )}

        {activeTab === "insights" && (
          <View className="py-8">
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg text-center">
              {language === "en" ? "Insights coming soon" : "Insights em breve"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
