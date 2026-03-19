/**
 * Home (Início) – Tela principal de reflexão diária.
 *
 * Referências de ícones e dados (pós-renome Virtus → Inself):
 * - Ícones de emoção: @/lib/icons (EMOTION_ICONS) – Lucide
 * - Lista de emoções: @/components/EmotionalCheckIn (INITIAL_EMOTIONS)
 * - Categorias/virtude do dia: @/lib/dailyReflections (CATEGORY_ICONS, CATEGORY_LABELS, getDailyReflection)
 * - Virtudes (nome + emoji): @/lib/virtues (VIRTUES) – virtueInfo = VIRTUES.find(v => v.id === daily.virtue)
 * - Ícones (categoria/virtude): @/components/AppIcon (MaterialCommunityIcons)
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Share, Alert } from "react-native";
import ViewShot from "react-native-view-shot";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TopHeader from "@/components/TopHeader";
import EmotionalCheckIn, {
  INITIAL_EMOTIONS,
  type InitialEmotion,
} from "@/components/EmotionalCheckIn";
import { EMOTION_ICONS } from "@/lib/icons";
import EmotionalCheckOut, { type FinalEmotion } from "@/components/EmotionalCheckOut";
import CheckInCelebration from "@/components/CheckInCelebration";
import { useAuth } from "@/contexts/AuthContext";
import { useReflectionsRefresh } from "@/contexts/ReflectionsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { darkColors } from "@/lib/themeDark";
import AppIcon from "@/components/AppIcon";
import { getDailyReflection, getDailyReflectionByCategoryVirtue, getCategoryLabel, CATEGORY_ICONS, type DailyReflection } from "@/lib/dailyReflections";
import { VIRTUES } from "@/lib/virtues";
import {
  getCheckinCount,
  didEarnNewBadge,
  getCurrentBadge,
  type Badge,
  localizeBadgeById,
} from "@/lib/badges";
import {
  saveReflection,
  toggleFavorite,
  getReflectionHistory,
} from "@/lib/reflectionHistory";
import { getTodayCheckin, saveEmotionalCheckin, saveEmotionalCheckout } from "@/lib/emotionalJourney";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import ShareReflectionCard from "@/components/ShareReflectionCard";
import { SHARE_CARD_WIDTH } from "@/components/ShareReflectionCard";

type AppPhase = "reflection" | "emotional-checkout";

const reflectionStepsLabels = [
  { id: 1, label: "Identifique" },
  { id: 2, label: "Aceite" },
  { id: 3, label: "Aja" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user, checkinCount: authCheckinCount, refreshCheckinCount } = useAuth();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";
  const iconOnPrimary = isDark ? darkColors.primaryForeground : "#F5F0E8";
  const [showEmotionalCheckin, setShowEmotionalCheckin] = useState(false);
  const [checkinDoneToday, setCheckinDoneToday] = useState(false);
  const [initialEmotion, setInitialEmotion] = useState<InitialEmotion | null>(null);
  const [phase, setPhase] = useState<AppPhase>("reflection");
  const [liked, setLiked] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [journeyFullyDone, setJourneyFullyDone] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [checkinCount, setCheckinCount] = useState(0);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [lastReflectionId, setLastReflectionId] = useState<string | null>(null);
  const [daily, setDaily] = useState<DailyReflection | null>(null);
  const { preferred_category_slugs, language } = useSettings();
  const { addNotification } = useNotifications();
  const { refreshReflections } = useReflectionsRefresh();
  const [highlightEmotionTag, setHighlightEmotionTag] = useState(false);
  const shareCardRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const streakScaleAnim = useRef(new Animated.Value(1)).current;

  const { height: windowHeight } = Dimensions.get("window");
  const sheetHeight = windowHeight * 0.5;
  const sheetMaxHeight = windowHeight * 0.85;
  const journeySheetAnim = useRef(new Animated.Value(sheetHeight)).current;
  const journeyOverlayAnim = useRef(new Animated.Value(0)).current;
  const emotionalSheetAnim = useRef(new Animated.Value(sheetHeight)).current;
  const emotionalOverlayAnim = useRef(new Animated.Value(0)).current;

  /* Badge "X dias" = número de dias em que o usuário completou uma jornada completa (reflexão salva). */
  const daysCount = authCheckinCount;

  const getEmotionLabel = React.useCallback(
    (emotionId: InitialEmotion) => {
      if (language !== "en") return INITIAL_EMOTIONS.find((e) => e.id === emotionId)?.label;
      const en: Record<InitialEmotion, string> = {
        anxious: "Anxious",
        stressed: "Stressed",
        confused: "Confused",
        unmotivated: "Unmotivated",
        calm: "Calm",
        confident: "Confident",
        "seeking-self-love": "Seeking self-love",
        "seeking-discipline": "Seeking discipline",
      };
      return en[emotionId] ?? INITIAL_EMOTIONS.find((e) => e.id === emotionId)?.label ?? emotionId;
    },
    [language]
  );

  useEffect(() => {
    if (showJourneyModal) {
      journeySheetAnim.setValue(sheetHeight);
      journeyOverlayAnim.setValue(0);
      Animated.parallel([
        Animated.timing(journeyOverlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(journeySheetAnim, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 200 }),
      ]).start();
    }
  }, [showJourneyModal]);

  useEffect(() => {
    if (showEmotionalCheckin) {
      emotionalSheetAnim.setValue(sheetHeight);
      emotionalOverlayAnim.setValue(0);
      Animated.parallel([
        Animated.timing(emotionalOverlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(emotionalSheetAnim, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 200 }),
      ]).start();
    }
  }, [showEmotionalCheckin]);

  const loadCheckinCount = useCallback(async () => {
    const count = await getCheckinCount();
    setCheckinCount(count);
  }, []);

  useEffect(() => {
    loadCheckinCount();
    refreshCheckinCount();
  }, [loadCheckinCount, refreshCheckinCount]);

  /** Snapshot diário da jornada da Home:
   * - calcula a jornada apenas uma vez por dia (UTC) e salva no AsyncStorage
   * - se o usuário já tiver a reflexão do dia, deriva a jornada a partir da categoria salva (mais consistente)
   * - mudanças em `preferred_category_slugs` no meio do dia não alteram `daily` até trocar o dia
   */
  const loadTodayReflectionState = useCallback(async () => {
    const todayUtcKey = new Date().toISOString().slice(0, 10);
    const userId = user?.id ?? "anon";
    const snapshotKey = `inself.homeDailySnapshot.v1.${userId}.${todayUtcKey}`;

    const [list, todayCheckin] = await Promise.all([getReflectionHistory(), getTodayCheckin()]);
    const entryToday = list.find((e) => (e.date || "").slice(0, 10) === todayUtcKey);

    // Jornada (daily) travada por dia
    let nextDaily: DailyReflection | null = null;

    // Se já existe reflexão do dia, derive pela categoria salva.
    if (entryToday?.category) {
      nextDaily = getDailyReflection([entryToday.category], language);
      try {
        await AsyncStorage.setItem(snapshotKey, JSON.stringify({ dateKey: todayUtcKey, daily: nextDaily }));
      } catch {
        // ignore storage errors
      }
    } else {
      // Tenta carregar snapshot do dia
      try {
        const raw = await AsyncStorage.getItem(snapshotKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { dateKey?: string; daily?: DailyReflection };
          if (parsed?.dateKey === todayUtcKey && parsed.daily) {
            nextDaily = parsed.daily;
          }
        }
      } catch {
        // ignore parse errors
      }

      // Se não existe snapshot, cria com as categorias atuais (limitando a 3)
      if (!nextDaily) {
        const preferredForDaily = preferred_category_slugs.slice(0, 3);
        nextDaily = getDailyReflection(preferredForDaily.length ? preferredForDaily : undefined, language);
        try {
          await AsyncStorage.setItem(snapshotKey, JSON.stringify({ dateKey: todayUtcKey, daily: nextDaily }));
        } catch {
          // ignore storage errors
        }
      }
    }

    // Se carregou um snapshot antigo (de outro idioma), re-monta o conteúdo no idioma atual
    if (nextDaily) {
      nextDaily = getDailyReflectionByCategoryVirtue(nextDaily.category, nextDaily.virtue, language);
    }

    setDaily(nextDaily);

    // Estado da jornada/conclusão do dia
    if (entryToday) {
      setJourneyFullyDone(true);
      setLastReflectionId(entryToday.id);
      setLiked(entryToday.favorited);
    } else {
      setJourneyFullyDone(false);
      setLastReflectionId(null);
      setLiked(false);
    }

    // Estado do check-in emocional do dia
    if (todayCheckin) {
      setCheckinDoneToday(true);
      setInitialEmotion(todayCheckin.emotion_slug);
    } else {
      setCheckinDoneToday(false);
      setInitialEmotion(null);
    }
  }, [user?.id, language]);

  useFocusEffect(
    useCallback(() => {
      loadTodayReflectionState();
    }, [loadTodayReflectionState])
  );

  useFocusEffect(
    useCallback(() => {
      if (!lastReflectionId) return;
      getReflectionHistory().then((list) => {
        const entry = list.find((e) => e.id === lastReflectionId);
        setLiked(Boolean(entry?.favorited));
      });
    }, [lastReflectionId])
  );

  const reflectionSteps = daily
    ? [
        {
          id: 1,
          label: language === "en" ? "Identify" : "Identifique",
          prompt: daily.steps.identifique,
        },
        {
          id: 2,
          label: language === "en" ? "Accept" : "Aceite",
          prompt: daily.steps.aceite,
        },
        {
          id: 3,
          label: language === "en" ? "Act" : "Aja",
          prompt: daily.steps.aja,
        },
      ]
    : [];

  const handleEmotionSelect = useCallback(
    (emotion: InitialEmotion) => {
      setInitialEmotion(emotion);
      setCheckinDoneToday(true);
      setShowEmotionalCheckin(false);
      setHighlightEmotionTag(false);
      saveEmotionalCheckin(emotion).catch(() => {});
      addNotification({
        type: "emotional_checkin",
        title: language === "en" ? "Emotional check-in saved" : "Check-in emocional realizado",
        message:
          language === "en" ? "You recorded how you feel today." : "Você registrou como está se sentindo hoje.",
      });
    },
    [addNotification]
  );

  const handleEmotionSkip = useCallback(() => {
    setShowEmotionalCheckin(false);
  }, []);

  const handleCheckoutSelect = useCallback(
    (emotion: FinalEmotion) => {
      setJourneyFullyDone(true);
      setJourneyComplete(false);
      setJourneyStarted(false);
      setShowCheckin(false);
      setCurrentStep(0);
      setAnswers(["", "", ""]);
      setNewBadge(null);
      setPhase("reflection");
      saveEmotionalCheckout(emotion).catch(() => {});
      addNotification({
        type: "checkout",
        title: language === "en" ? "Emotional checkout completed" : "Checkout realizado",
        message:
          language === "en" ? "You completed the emotional checkout for your reflection." : "Você concluiu o checkout emocional da reflexão.",
      });
    },
    [addNotification]
  );

  const handleJourneyFinish = useCallback(async () => {
    setShowJourneyModal(false);
    setShowCheckin(false);
    setJourneyStarted(false);
    setJourneyComplete(false);
    setPhase("reflection");
    setCurrentStep(0);
    setAnswers(["", "", ""]);
    setNewBadge(null);
    setJourneyFullyDone(true);
    await refreshCheckinCount();
    streakScaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(streakScaleAnim, { toValue: 1.35, duration: 200, useNativeDriver: true }),
      Animated.spring(streakScaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
    ]).start();
  }, [refreshCheckinCount, streakScaleAnim]);

  const handleStartJourney = () => {
    setJourneyStarted(true);
    setCurrentStep(0);
    setAnswers(["", "", ""]);
    setJourneyComplete(false);
  };

  const handleNext = async () => {
    if (currentStep < reflectionSteps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }
    const a0 = String(answers[0] ?? "").trim();
    const a1 = String(answers[1] ?? "").trim();
    const a2 = String(answers[2] ?? "").trim();
    if (!a0 || !a1 || !a2) return;
    try {
      const saved = await saveReflection({
        date: new Date().toISOString(),
        message: daily!.message,
        quote: daily!.quote,
        author: daily!.author,
        firstPrompt: daily!.steps.identifique ?? null,
        answers: { identifique: a0, aceite: a1, aja: a2 },
        checkinCount,
        badgeEarned: didEarnNewBadge(checkinCount, checkinCount + 1, language) ?? null,
        category: daily!.category,
        virtue: daily!.virtue,
      });
      setCheckinCount(saved.checkinCount);
      refreshCheckinCount();
      setNewBadge(saved.badgeEarned ? localizeBadgeById(saved.badgeEarned.id, language) : null);
      setLastReflectionId(saved.id);
      setJourneyComplete(true);
      refreshReflections();
      addNotification({
        type: "reflection",
        title: language === "en" ? "Reflection completed" : "Reflexão realizada",
        message: language === "en" ? "You completed today’s reflection." : "Você completou a reflexão de hoje.",
      });
      if (saved.badgeEarned) {
        const localizedBadge = localizeBadgeById(saved.badgeEarned.id, language);
        addNotification({
          type: "badge",
          title: language === "en" ? "New badge unlocked" : "Novo emblema desbloqueado",
          message:
            language === "en"
              ? `You unlocked the badge ${localizedBadge?.name ?? saved.badgeEarned.name}.`
              : `Você desbloqueou o emblema ${localizedBadge?.name ?? saved.badgeEarned.name}.`,
          payload: { badgeName: localizedBadge?.name ?? saved.badgeEarned.name },
        });
      }
    } catch (e) {
      Alert.alert(
        language === "en" ? "Save error" : "Erro ao salvar",
        e instanceof Error ? e.message : "Não foi possível salvar a reflexão. Verifique a conexão e tente novamente."
      );
    }
  };

  const handleAnswerChange = (value: string) => {
    const updated = [...answers];
    updated[currentStep] = value;
    setAnswers(updated);
  };

  const handleReset = () => {
    setJourneyStarted(false);
    setJourneyComplete(false);
    setShowCheckin(false);
    setCurrentStep(0);
    setAnswers(["", "", ""]);
    setNewBadge(null);
    setLiked(false);
    setLastReflectionId(null);
    setPhase("reflection");
  };

  const handleSaveOrToggleFavorite = async () => {
    if (!lastReflectionId) return;
    const isFav = await toggleFavorite(lastReflectionId);
    setLiked(isFav);
    refreshReflections();
  };

  const handleShareReflection = async () => {
    if (isSharing || !shareCardRef.current) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        width: SHARE_CARD_WIDTH,
      });
      const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: language === "en" ? "Share reflection" : "Compartilhar reflexão",
        });
      } else {
        Share.share({
          message: `✦ ${language === "en" ? "REFLECTION" : "REFLEXÃO"}\n\n${daily!.message}\n\n"${daily!.quote}"\n— ${daily!.author}\n\ninself — ${language === "en" ? "Reflection & Self-Knowledge" : "Reflexão & Autoconhecimento"}`,
          title: language === "en" ? "InSelf Reflection" : "Reflexão InSelf",
        });
      }
    } catch (e) {
      Share.share({
        message: `✦ ${language === "en" ? "REFLECTION" : "REFLEXÃO"}\n\n${daily!.message}\n\n"${daily!.quote}"\n— ${daily!.author}\n\ninself — ${language === "en" ? "Reflection & Self-Knowledge" : "Reflexão & Autoconhecimento"}`,
        title: language === "en" ? "InSelf Reflection" : "Reflexão InSelf",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";
  const greeting = (() => {
    const h = new Date().getHours();
    const name = firstName ? `, ${firstName}` : "";
    if (language === "en") {
      if (h < 12) return `Good morning${name}.`;
      if (h < 18) return `Good afternoon${name}.`;
      return `Good evening${name}.`;
    }
    if (h < 12) return `Bom dia${name}.`;
    if (h < 18) return `Boa tarde${name}.`;
    return `Boa noite${name}.`;
  })();

  if (!daily) {
    return (
      <View className="flex-1 bg-background dark:bg-dark-bg items-center justify-center">
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg">Carregando...</Text>
      </View>
    );
  }

  const virtueInfo = VIRTUES.find((v) => v.id === daily.virtue);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      {/* Card off-screen para gerar imagem do compartilhamento (altura definida pelo conteúdo) */}
      <View
        style={{
          position: "absolute",
          left: -SHARE_CARD_WIDTH - 100,
          top: 0,
          width: SHARE_CARD_WIDTH,
          maxHeight: 3000,
        }}
        pointerEvents="none"
      >
        <ViewShot
          ref={shareCardRef}
          options={{ format: "png", quality: 1, result: "tmpfile" }}
          style={{ width: SHARE_CARD_WIDTH }}
        >
          <ShareReflectionCard reflection={daily} virtue={virtueInfo ?? null} isDark={isDark} language={language} />
        </ViewShot>
      </View>
      <TopHeader />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 25,
            paddingHorizontal: 24,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl text-foreground dark:text-dark-fg font-body-light">{greeting}</Text>
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mt-1">
              {format(new Date(), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </Text>
          </View>
          <Animated.View
            style={{ transform: [{ scale: streakScaleAnim }] }}
            className="flex-row items-center gap-1.5 bg-card dark:bg-dark-muted rounded-full px-3 py-1.5"
          >
            <MaterialCommunityIcons name="fire" size={14} color={isDark ? darkColors.foreground : "#5A7A66"} />
            <Text className="text-xs font-semibold text-foreground dark:text-dark-fg">
              {daysCount} {daysCount === 1 ? (language === "en" ? "day" : "dia") : language === "en" ? "days" : "dias"}
            </Text>
          </Animated.View>
        </View>

        {!checkinDoneToday ? (
          <Pressable
            onPress={() => setShowEmotionalCheckin(true)}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-dark-primary self-start mb-4"
          >
            <Text className="text-sm font-medium text-primary dark:text-dark-primary-fg">
              {language === "en" ? "How are you feeling?" : "Como você está se sentindo?"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={isDark ? darkColors.primaryForeground : "#5A7A66"} />
          </Pressable>
        ) : initialEmotion ? (
          journeyFullyDone ? (
            <View
              className={`flex-row items-center gap-2 px-4 py-1.5 rounded-full self-start mb-4 ${
                highlightEmotionTag ? "bg-primary/15 border border-primary dark:bg-dark-card dark:border-dark-border" : "bg-card dark:bg-dark-card"
              }`}
            >
              {(() => {
                const Icon = EMOTION_ICONS[initialEmotion as keyof typeof EMOTION_ICONS];
                return Icon ? <Icon size={16} color={iconPrimary} /> : null;
              })()}
              <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                {getEmotionLabel(initialEmotion)}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowEmotionalCheckin(true)}
              className={`flex-row items-center gap-2 px-4 py-1.5 rounded-full self-start mb-4 ${
                highlightEmotionTag ? "bg-primary/15 border border-primary shadow-sm dark:bg-dark-card dark:border-dark-border" : "bg-card dark:bg-dark-card"
              }`}
            >
              {(() => {
                const Icon = EMOTION_ICONS[initialEmotion as keyof typeof EMOTION_ICONS];
                return Icon ? <Icon size={16} color={iconPrimary} /> : null;
              })()}
              <Text className="text-sm font-medium text-foreground dark:text-dark-fg">
                {getEmotionLabel(initialEmotion)}
              </Text>
            </Pressable>
          )
        ) : null}

        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg mb-6 leading-snug">
          {daily.message.split(".").length > 1 ? (
            <>
              {daily.message.split(".")[0].trim()}.{" "}
              <Text className="text-primary dark:text-dark-primary">
                {daily.message.split(".").slice(1).join(". ").trim()}.
              </Text>
            </>
          ) : (
            <>
              {daily.message.split(" ").slice(0, Math.ceil(daily.message.split(" ").length / 2)).join(" ")}{" "}
              <Text className="text-primary dark:text-dark-primary">
                {daily.message.split(" ").slice(Math.ceil(daily.message.split(" ").length / 2)).join(" ")}
              </Text>
            </>
          )}
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-card dark:bg-dark-muted">
            <AppIcon name={CATEGORY_ICONS[daily.category] as any} size="base" color={iconMuted} />
            <Text className="text-xs font-medium text-muted-foreground dark:text-dark-fg">
              {getCategoryLabel(daily.category, language)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 dark:bg-dark-muted">
            <AppIcon name={(virtueInfo?.icon ?? "star") as any} size="base" color={iconPrimary} />
            <Text className="text-xs font-medium text-primary dark:text-dark-fg">
              {virtueInfo ? (language === "en" ? virtueInfo.nameEn : virtueInfo.name) : daily.virtue}
            </Text>
          </View>
        </View>

        <View className="w-12 h-px bg-border dark:bg-dark-border mb-6" />

        <View className="mb-6">
          <Text className="text-base text-muted-foreground dark:text-dark-fg italic leading-relaxed mb-2">
            "{daily.quote}"
          </Text>
          <Text className="text-xs text-muted-foreground/70 dark:text-dark-muted-fg uppercase tracking-wide">
            — {daily.author}
          </Text>
        </View>

        <View className="bg-primary/10 dark:bg-dark-card rounded-2xl p-4 mb-4 border border-primary/10 dark:border-dark-border">
          <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold mb-3">
            {language === "en" ? "Reflection" : "Reflexão"}
          </Text>

          <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed mb-4">
            {reflectionSteps[0].prompt}
          </Text>

          {!journeyFullyDone ? (
            <Pressable
              onPress={() => {
                handleStartJourney();
                setShowJourneyModal(true);
              }}
              className="flex-row items-center gap-2"
            >
              <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                {language === "en" ? "Start reflection" : "Começar reflexão"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={iconPrimary} />
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="check-circle" size={16} color={iconPrimary} />
              <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                {language === "en" ? "Journey completed" : "Jornada concluída"}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={handleSaveOrToggleFavorite}
            disabled={!lastReflectionId}
            className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full border ${
              !lastReflectionId
                ? "opacity-50 border-border dark:border-dark-border"
                : liked
                  ? "bg-primary/10 border-primary dark:bg-dark-card dark:border-dark-primary"
                  : "border-border dark:border-dark-border"
            }`}
          >
            <MaterialCommunityIcons name={liked ? "heart" : "heart-outline"} size={16} color={iconPrimary} />
            <Text className="text-sm font-medium text-primary dark:text-dark-primary">
              {language === "en" ? "Save" : "Salvar"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShareReflection}
            disabled={isSharing}
            className="flex-row items-center gap-2 px-5 py-2.5 rounded-full border border-border dark:border-dark-border"
          >
            <MaterialCommunityIcons name="share-variant" size={16} color={iconMuted} />
            <Text className="text-sm font-medium text-muted-foreground dark:text-dark-muted-fg">
              {isSharing ? (language === "en" ? "Generating…" : "Gerando…") : language === "en" ? "Share" : "Compartilhar"}
            </Text>
          </Pressable>
        </View>
        </ScrollView>

        {showJourneyModal && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", opacity: journeyOverlayAnim }]}
            pointerEvents="box-none"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "padding"}
              style={{ width: "100%", flex: 1, justifyContent: "flex-end" }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <Animated.View
                style={[
                  { transform: [{ translateY: journeySheetAnim }], width: "100%", maxHeight: sheetMaxHeight },
                ]}
              >
                <View className="bg-background dark:bg-dark-bg rounded-t-3xl p-6" style={{ maxHeight: sheetMaxHeight }}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  keyboardDismissMode="interactive"
                >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold">
                    {language === "en" ? "Reflection" : "Reflexão"}
                  </Text>
                  <Pressable
                    onPress={() => {
                      if (journeyComplete && lastReflectionId) {
                        setShowJourneyModal(false);
                        setJourneyFullyDone(true);
                        setJourneyComplete(false);
                        setPhase("reflection");
                        setShowCheckin(false);
                        setJourneyStarted(false);
                      } else {
                        handleReset();
                        setShowJourneyModal(false);
                      }
                    }}
                    className="p-1.5"
                  >
                    <MaterialCommunityIcons name="close" size={16} color={iconMuted} />
                  </Pressable>
                </View>

                {journeyStarted && !journeyComplete && (
                  <View>
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-2">
                        {reflectionSteps.map((step, i) => (
                          <View key={step.id} className="flex-row items-center gap-2">
                            <View
                              className={`w-6 h-6 rounded-full items-center justify-center ${
                                i < currentStep
                                  ? "bg-primary dark:bg-dark-primary"
                                  : i === currentStep
                                  ? "bg-primary/20 border border-primary dark:bg-dark-primary/20 dark:border-dark-primary"
                                  : "bg-muted dark:bg-dark-muted"
                              }`}
                            >
                              {i < currentStep ? (
                                <MaterialCommunityIcons name="check-circle" size={14} color={iconOnPrimary} />
                              ) : (
                                <Text className={`text-[12px] font-semibold ${i === currentStep ? "text-primary dark:text-dark-primary" : "text-muted-foreground dark:text-dark-muted-fg"}`}>
                                  {step.id}
                                </Text>
                              )}
                            </View>
                            {i < reflectionSteps.length - 1 && (
                              <View className={`w-6 h-px ${i < currentStep ? "bg-primary dark:bg-dark-primary" : "bg-border dark:bg-dark-border"}`} />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    <Text className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-muted-fg font-semibold mb-1">
                      {reflectionSteps[currentStep].label}
                    </Text>
                    <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed mb-4">
                      {reflectionSteps[currentStep].prompt}
                    </Text>

                    <TextInput
                      value={answers[currentStep]}
                      onChangeText={handleAnswerChange}
                      placeholder={language === "en" ? "Write your thoughts..." : "Escreva seus pensamentos..."}
                      placeholderTextColor={isDark ? darkColors.mutedForeground : "#9CA3AF"}
                      multiline
                      numberOfLines={3}
                      className="w-full bg-background/60 dark:bg-dark-muted rounded-xl px-4 py-3 text-sm text-foreground dark:text-dark-fg border border-border dark:border-dark-border mb-3"
                      textAlignVertical="top"
                    />

                    <View className="flex-row items-center justify-between">
                      {currentStep > 0 ? (
                        <Pressable
                          onPress={() => setCurrentStep((s) => s - 1)}
                          className="py-2"
                        >
                          <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                            {language === "en" ? "Back" : "Voltar"}
                          </Text>
                        </Pressable>
                      ) : (
                        <View className="flex-1" />
                      )}
                      <Pressable
                        onPress={handleNext}
                        disabled={!answers[currentStep].trim()}
                        className={`flex-row items-center gap-2 px-6 py-2.5 rounded-full ${
                          answers[currentStep].trim() ? "bg-primary dark:bg-dark-primary" : "bg-muted dark:bg-dark-muted"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            answers[currentStep].trim() ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
                          }`}
                        >
                            {currentStep < reflectionSteps.length - 1 ? (language === "en" ? "Next" : "Próximo") : language === "en" ? "Finish" : "Concluir"}
                        </Text>
                        <MaterialCommunityIcons
                          name="send"
                          size={14}
                          color={answers[currentStep].trim() ? iconOnPrimary : (isDark ? darkColors.mutedForeground : "#9CA3AF")}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}

                {journeyComplete && !showCheckin && phase !== "emotional-checkout" && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-4">
                      <MaterialCommunityIcons name="check-circle" size={20} color={iconPrimary} />
                      <Text className="text-base font-serif font-semibold text-foreground dark:text-dark-fg">
                        {language === "en" ? "Reflection completed" : "Reflexão concluída"}
                      </Text>
                    </View>
                    <View className="gap-3 mb-4">
                      {reflectionSteps.map((step, i) => (
                        <View key={step.id} className="bg-background/60 dark:bg-dark-muted rounded-xl p-3">
                          <Text className="text-[12px] uppercase tracking-[0.15em] text-primary dark:text-dark-primary font-semibold mb-1">
                            {step.label}
                          </Text>
                          <Text className="text-sm text-foreground/80 dark:text-dark-fg leading-relaxed">{answers[i]}</Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => setPhase("emotional-checkout")}
                        className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-primary dark:bg-dark-primary"
                      >
                        <MaterialCommunityIcons name="check-circle" size={14} color={iconOnPrimary} />
                        <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
                          {language === "en" ? "Continue" : "Continuar"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setCurrentStep(0);
                          setAnswers(["", "", ""]);
                          setJourneyComplete(false);
                          setPhase("reflection");
                          setShowCheckin(false);
                        }}
                        className="py-2"
                      >
                        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg font-medium">
                          {language === "en" ? "Redo" : "Refazer"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {journeyComplete && phase === "emotional-checkout" && !showCheckin && (
                  <EmotionalCheckOut
                    onSelect={(emotion) => {
                      handleCheckoutSelect(emotion);
                      setShowCheckin(true);
                      setPhase("reflection");
                    }}
                  />
                )}

                {showCheckin && (
                  <CheckInCelebration
                    checkinCount={checkinCount}
                    newBadge={newBadge}
                    onContinue={handleJourneyFinish}
                  />
                )}
                </ScrollView>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}

        {showEmotionalCheckin && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", opacity: emotionalOverlayAnim }]}
            pointerEvents="box-none"
          >
            <Animated.View style={{ transform: [{ translateY: emotionalSheetAnim }] }}>
              <View className="bg-background dark:bg-dark-bg rounded-t-3xl p-6">
                <EmotionalCheckIn onSelect={handleEmotionSelect} onSkip={handleEmotionSkip} inline />
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
