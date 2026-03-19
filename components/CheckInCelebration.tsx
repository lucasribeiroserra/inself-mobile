import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Badge } from "@/lib/badges";
import { BADGES, getCurrentBadge, getNextBadge } from "@/lib/badges";
import AppIcon from "./AppIcon";
import { useSettings } from "@/contexts/SettingsContext";

const PRIMARY = "#5A7A66";

interface CheckInCelebrationProps {
  checkinCount: number;
  newBadge: Badge | null;
  onContinue: () => void;
}

export default function CheckInCelebration({
  checkinCount,
  newBadge,
  onContinue,
}: CheckInCelebrationProps) {
  const currentBadge = getCurrentBadge(checkinCount);
  const nextBadge = getNextBadge(checkinCount);
  const { language } = useSettings();
  const progress = nextBadge
    ? ((checkinCount - (currentBadge?.requiredCheckins || 0)) /
        (nextBadge.requiredCheckins - (currentBadge?.requiredCheckins || 0))) *
      100
    : 100;

  return (
    <View className="items-center">
      {/* Ícone check-in em círculo (estilo Inself) */}
      <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
        <MaterialCommunityIcons name="check-circle" size={32} color={PRIMARY} />
      </View>

      <Text className="text-lg font-serif font-semibold text-primary dark:text-dark-primary mb-1">
        {language === "en" ? "Checkout completed!" : "Check-out concluído!"}
      </Text>
      <Text className="text-sm text-muted-foreground mb-5">
        {checkinCount} {checkinCount === 1 ? (language === "en" ? "reflection" : "reflexão") : (language === "en" ? "reflections" : "reflexões")}{" "}
        {language === "en" ? "completed" : "completadas"}
      </Text>

      {/* Novo badge desbloqueado */}
      {newBadge && (
        <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-5 w-full max-w-[280px]">
          <View className="flex-row items-center justify-center gap-2 mb-2">
            <MaterialCommunityIcons name="medal" size={16} color={PRIMARY} />
            <Text className="text-[12px] uppercase tracking-[0.2em] text-primary font-semibold">
              {language === "en" ? "New badge unlocked!" : "Novo badge desbloqueado!"}
            </Text>
          </View>
          <View className="items-center mb-1">
            <AppIcon name={newBadge.icon as any} size="3xl" color="#5A7A66" />
          </View>
          <Text className="text-base font-serif font-semibold text-foreground text-center">
            {newBadge.name}
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            {newBadge.description}
          </Text>
        </View>
      )}

      {/* Barra de progresso para próximo badge */}
      {nextBadge && (
        <View className="w-full max-w-[280px] mb-5">
          <View className="flex-row justify-between mb-2">
            {currentBadge ? (
              <View className="flex-row items-center gap-1">
                <AppIcon name={currentBadge.icon as any} size="xs" color="#6B7280" />
                <Text className="text-[12px] text-muted-foreground">{currentBadge.name}</Text>
              </View>
            ) : (
              <Text className="text-[12px] text-muted-foreground">{language === "en" ? "Start" : "Início"}</Text>
            )}
            <View className="flex-row items-center gap-1">
              <AppIcon name={nextBadge.icon as any} size="xs" color="#6B7280" />
              <Text className="text-[12px] text-muted-foreground">{nextBadge.name}</Text>
            </View>
          </View>
          <View className="h-1.5 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
          <Text className="text-[12px] text-muted-foreground mt-1.5 text-center">
            {language === "en"
              ? `Remaining ${nextBadge.requiredCheckins - checkinCount} to ${nextBadge.name}`
              : `Faltam ${nextBadge.requiredCheckins - checkinCount} para ${nextBadge.name}`}
          </Text>
        </View>
      )}

      {/* Lista de todos os badges (bloqueados em grayscale) */}
      <View className="flex-row flex-wrap justify-center gap-2 mb-5">
        {BADGES.map((badge) => (
          <View
            key={badge.id}
            style={{
              opacity: checkinCount >= badge.requiredCheckins ? 1 : 0.3,
            }}
          >
            <AppIcon name={badge.icon as any} size="lg" color="#5A7A66" />
          </View>
        ))}
      </View>

      <Pressable
        onPress={onContinue}
        className="flex-row items-center gap-1 py-2"
      >
        <Text className="text-sm font-medium text-primary">{language === "en" ? "Continue" : "Continuar"}</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={PRIMARY} />
      </Pressable>
    </View>
  );
}
