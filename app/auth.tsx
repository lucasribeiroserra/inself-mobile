import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { isApiConfigured } from "@/lib/api";
import { darkColors } from "@/lib/themeDark";

// Integração com Google desativada temporariamente; reativar quando configurar client IDs.

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  return (
    <View
      className="absolute left-4 right-4 rounded-xl bg-destructive/95 px-4 py-3"
      style={{ top: insets.top + 12, zIndex: 1000 }}
    >
      <Text className="text-sm font-medium text-destructive-foreground">{message}</Text>
    </View>
  );
}

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "nao-binario", label: "Não-binário" },
  { value: "prefiro-nao-dizer", label: "Prefiro não dizer" },
];

const GENDER_OPTIONS_EN: Record<string, string> = {
  masculino: "Male",
  feminino: "Female",
  "nao-binario": "Non-binary",
  "prefiro-nao-dizer": "Prefer not to say",
};

function ProfileSetupStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const placeholderColor = isDark ? darkColors.mutedForeground : "#9CA3AF";
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onComplete();
    }, 500);
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-6">
        <Text className="font-serif font-bold text-primary dark:text-dark-primary text-2xl tracking-wide">InSelf</Text>
      </View>
      <Text className="text-xl font-serif font-semibold text-foreground dark:text-dark-fg text-center mb-1">
        {language === "en" ? "Complete your profile" : "Complete seu perfil"}
      </Text>
      <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg text-center mb-6">
        {language === "en" ? "These details are optional" : "Essas informações são opcionais"}
      </Text>

      <View className="bg-card dark:bg-dark-card rounded-3xl p-5 border border-border dark:border-dark-border gap-4">
        <View>
          <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg mb-1.5">
            {language === "en" ? "Name" : "Nome"}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={language === "en" ? "How would you like to be called?" : "Como gostaria de ser chamado?"}
            className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            placeholderTextColor={placeholderColor}
          />
        </View>
        <View>
          <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg mb-1.5">
            {language === "en" ? "Gender" : "Gênero"}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setGender(gender === opt.value ? "" : opt.value)}
                className={`px-3 py-2 rounded-xl border ${
                  gender === opt.value
                    ? "bg-primary/10 dark:bg-dark-primary/10 border-primary dark:border-dark-primary"
                    : "bg-muted/50 dark:bg-dark-muted/50 border-border dark:border-dark-border"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    gender === opt.value ? "text-primary dark:text-dark-primary" : "text-muted-foreground dark:text-dark-muted-fg"
                  }`}
                >
                  {language === "en" ? GENDER_OPTIONS_EN[opt.value] ?? opt.label : opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View>
          <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-fg mb-1.5">
            {language === "en" ? "Date of Birth" : "Data de Nascimento"}
          </Text>
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            className="bg-muted/50 dark:bg-dark-muted/50 border border-border dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-foreground dark:text-dark-fg"
            placeholderTextColor={placeholderColor}
          />
        </View>
      </View>

      <View className="mt-6 gap-3">
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-primary dark:bg-dark-primary py-3.5 rounded-full items-center"
        >
          <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
            {saving ? (language === "en" ? "Saving..." : "Salvando...") : language === "en" ? "Save" : "Salvar"}
          </Text>
        </Pressable>
        <Pressable onPress={onSkip} className="items-center py-2">
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg">
            {language === "en" ? "Skip" : "Pular"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const placeholderColor = isDark ? darkColors.mutedForeground : "#9CA3AF";
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setError(null);
    setToast(msg);
  };

  if (showProfileSetup) {
    return (
      <ProfileSetupStep
        onComplete={() => router.replace("/(tabs)")}
        onSkip={() => router.replace("/(tabs)")}
      />
    );
  }

  const handleSubmit = async () => {
    setError(null);
    setToast(null);
    const nome = name?.trim() ?? "";
    const e = email?.trim() ?? "";
    const p = password ?? "";

    if (isLogin) {
      if (!e || !p) {
        showToast(language === "en" ? "Email and password are required." : "Email e senha são obrigatórios.");
        return;
      }
      if (!isApiConfigured()) {
        showToast(
          language === "en"
            ? "API not connected. In the project root .env file, add: EXPO_PUBLIC_API_URL=http://localhost:3000 (and start your API server)."
            : "API não conectada. No arquivo .env na raiz do projeto, adicione: EXPO_PUBLIC_API_URL=http://localhost:3000 (e suba o servidor da API)."
        );
        return;
      }
    } else {
      if (!nome) {
        showToast(language === "en" ? "Name is required." : "Nome é obrigatório.");
        return;
      }
      if (!e || !p) {
        showToast(language === "en" ? "Email and password are required." : "Email e senha são obrigatórios.");
        return;
      }
      if (!isApiConfigured()) {
        showToast(
          language === "en"
            ? "API not connected. In .env add EXPO_PUBLIC_API_URL=http://localhost:3000 and start your API server."
            : "API não conectada. No .env adicione EXPO_PUBLIC_API_URL=http://localhost:3000 e suba o servidor da API."
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(e, p);
        router.replace("/(tabs)");
      } else {
        await signUp(e, p, nome);
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (language === "en" ? "Sign-in error. Please try again." : "Erro ao entrar. Tente novamente.");
      const normalized =
        message.includes("inválidos") || message.includes("não encontrado") || message.includes("senha")
          ? language === "en"
            ? "User does not exist or the password is incorrect."
            : "Usuário não existe ou a senha está incorreta."
          : message;
      showToast(normalized);
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background dark:bg-dark-bg"
    >
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <Text className="font-serif font-bold text-primary/10 dark:text-dark-primary/10 text-[282px]">V</Text>
        </View>

        <View className="items-center gap-2 mb-8">
          <Text className="font-serif font-bold text-primary dark:text-dark-primary text-2xl tracking-wide">InSelf</Text>
        </View>

        {error ? (
          <Text className="text-sm text-destructive dark:text-destructive mb-2 text-center">{error}</Text>
        ) : null}
        <View className="gap-3 mb-4">
          {!isLogin ? (
            <TextInput
              placeholder={language === "en" ? "Name" : "Nome"}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-foreground dark:text-dark-fg"
              placeholderTextColor={placeholderColor}
            />
          ) : null}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-foreground dark:text-dark-fg"
            placeholderTextColor={placeholderColor}
          />
          <TextInput
            placeholder={language === "en" ? "Password" : "Senha"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-foreground dark:text-dark-fg"
            placeholderTextColor={placeholderColor}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-primary dark:bg-dark-primary py-3.5 rounded-full items-center mb-4"
        >
          <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
            {loading
              ? language === "en"
                ? "Signing in..."
                : "Entrando..."
              : isLogin
                ? language === "en"
                  ? "Sign in"
                  : "Entrar"
                : language === "en"
                  ? "Create account"
                  : "Criar conta"}
          </Text>
        </Pressable>

        <Pressable onPress={() => setIsLogin(!isLogin)} className="items-center py-2">
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg">
            {isLogin
              ? language === "en"
                ? "Don't have an account? Sign up"
                : "Não tem conta? Cadastre-se"
              : language === "en"
                ? "Already have an account? Sign in"
                : "Já tem conta? Entrar"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
