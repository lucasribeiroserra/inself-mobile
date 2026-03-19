import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { darkColors } from "@/lib/themeDark";
import { apiFetch, isApiConfigured } from "@/lib/api";

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "nao-binario", label: "Não-binário" },
  { value: "prefiro-nao-dizer", label: "Prefiro não dizer" },
];

export default function AccountDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";
  const placeholderColor = isDark ? darkColors.mutedForeground : "#9CA3AF";
  const iconFg = isDark ? darkColors.foreground : "#1f2937";

  const [name, setName] = React.useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );
  const [email] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [genderLabel, setGenderLabel] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [showGenderPicker, setShowGenderPicker] = React.useState(false);

  const profileAvatarUrl = user?.avatar_url ?? avatarUrl;

  const getGenderLabel = (value: string) => {
    if (language !== "en") return GENDER_OPTIONS.find((o) => o.value === value)?.label ?? "";
    const en: Record<string, string> = {
      masculino: "Male",
      feminino: "Female",
      "nao-binario": "Non-binary",
      "prefiro-nao-dizer": "Prefer not to say",
    };
    return en[value] ?? "";
  };

  React.useEffect(() => {
    if (!isApiConfigured()) return;
    apiFetch<{ full_name?: string; display_name?: string; gender?: string; birth_date?: string; avatar_url?: string | null }>("/profile").then(
      ({ data }) => {
        if (data) {
          setName(data.display_name || data.full_name || "");
          setGender(data.gender || "");
          setGenderLabel(data.gender ? getGenderLabel(data.gender) : "");
          setBirthDate(data.birth_date ? data.birth_date.slice(0, 10) : "");
          setAvatarUrl(data.avatar_url ?? null);
        }
      }
    );
  }, [user?.avatar_url]);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      {/* Header igual Virtus: botão voltar (rounded-xl bg-card) + título */}
      <View
        className="flex-row items-center gap-3 border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 16 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-card dark:bg-dark-card items-center justify-center"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={iconFg} />
        </Pressable>
        <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg flex-1">
          {language === "en" ? "Account Details" : "Detalhes da Conta"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {profileAvatarUrl ? (
          <View className="items-center mb-4">
            <Image
              source={{ uri: profileAvatarUrl }}
              className="w-20 h-20 rounded-full bg-muted dark:bg-dark-muted"
              resizeMode="cover"
            />
          </View>
        ) : null}

        <View className="bg-card dark:bg-dark-card rounded-3xl p-5 gap-4">
          {/* Nome - label com ícone igual Virtus */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="account" size={12} color={iconMuted} />
              <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg">
                {language === "en" ? "Name" : "Nome"}
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={language === "en" ? "Your name" : "Seu nome"}
              placeholderTextColor={placeholderColor}
              className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            />
          </View>

          {/* Email */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="email-outline" size={12} color={iconMuted} />
              <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg">
                {language === "en" ? "Email" : "Email"}
              </Text>
            </View>
            <TextInput
              value={email}
              editable={false}
              placeholder={language === "en" ? "your@email.com" : "seu@email.com"}
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            />
          </View>

          {/* Senha - placeholder igual Virtus */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="key-outline" size={12} color={iconMuted} />
              <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg">
                {language === "en" ? "Password" : "Senha"}
              </Text>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={language === "en" ? "New password (leave empty to keep it)" : "Nova senha (deixe vazio para manter)"}
              placeholderTextColor={placeholderColor}
              secureTextEntry
              className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            />
          </View>

          {/* Gênero - seletor igual Virtus */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="account-group-outline" size={12} color={iconMuted} />
              <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg">
                {language === "en" ? "Gender" : "Gênero"}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowGenderPicker(true)}
              className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 flex-row items-center justify-between"
            >
              <Text className={`text-sm ${genderLabel ? "text-foreground dark:text-dark-fg" : "text-muted-foreground dark:text-dark-muted-fg"}`}>
                {genderLabel || (language === "en" ? "Select" : "Selecione")}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={iconMuted} />
            </Pressable>
          </View>

          {/* Data de Nascimento */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="calendar" size={12} color={iconMuted} />
              <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg">
                {language === "en" ? "Date of Birth" : "Data de Nascimento"}
              </Text>
            </View>
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder={language === "en" ? "YYYY-MM-DD" : "DD/MM/AAAA"}
              placeholderTextColor={placeholderColor}
              className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            />
          </View>

          {/* Salvar */}
          <Pressable
            onPress={async () => {
              setSaving(true);
              if (isApiConfigured()) {
                await apiFetch("/profile", {
                  method: "PATCH",
                  body: { full_name: name, display_name: name, gender: gender || undefined, birth_date: birthDate || undefined },
                });
                await refreshUser();
              }
              setTimeout(() => setSaving(false), 800);
            }}
            disabled={saving}
            className="bg-primary dark:bg-dark-primary rounded-xl py-3 items-center mt-1 opacity-100"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
              {saving ? (language === "en" ? "Saving..." : "Salvando...") : language === "en" ? "Save" : "Salvar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Gênero - igual Virtus select */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowGenderPicker(false)}
        >
          <Pressable className="bg-background dark:bg-dark-bg rounded-t-3xl p-6 pb-10" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg">
                {language === "en" ? "Gender" : "Gênero"}
              </Text>
              <Pressable onPress={() => setShowGenderPicker(false)} className="p-2">
                <MaterialCommunityIcons name="close" size={20} color={iconMuted} />
              </Pressable>
            </View>
            <View className="gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setGender(opt.value);
                    setGenderLabel(getGenderLabel(opt.value));
                    setShowGenderPicker(false);
                  }}
                  className={`p-4 rounded-2xl ${gender === opt.value ? "bg-primary/10 dark:bg-dark-primary/10 border border-primary dark:border-dark-primary" : "bg-card dark:bg-dark-card"}`}
                >
                  <Text
                    className={`text-sm font-medium ${gender === opt.value ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-fg"}`}
                  >
                    {getGenderLabel(opt.value)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
