import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <View className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <Text className="text-muted-foreground mt-4">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Pressable onPress={() => router.replace("/auth")}>
        <Text className="text-primary">Ir para login</Text>
      </Pressable>
    </View>
  );
}
