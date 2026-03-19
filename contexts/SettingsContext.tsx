import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiFetch, isApiConfigured } from "@/lib/api";
import type { ReflectionCategory } from "@/lib/dailyReflections";

type SettingsState = {
  reminder_enabled: boolean;
  reminder_time: string;
  preferred_category_slugs: ReflectionCategory[];
  language: "pt" | "en";
};

const defaultSettings: SettingsState = {
  reminder_enabled: true,
  reminder_time: "07:00",
  preferred_category_slugs: [],
  language: "pt",
};

type SettingsContextType = SettingsState & {
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (patch: Partial<SettingsState>) => Promise<void>;
  updatePushToken: (token: string | null) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  ...defaultSettings,
  loading: false,
  refreshSettings: async () => {},
  updateSettings: async () => {},
  updatePushToken: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    const { data } = await apiFetch<SettingsState & { theme?: string }>("/settings");
    if (data) {
      setState({
        reminder_enabled: data.reminder_enabled ?? true,
        reminder_time: data.reminder_time ?? "07:00",
        preferred_category_slugs: (data.preferred_category_slugs as ReflectionCategory[]) ?? [],
        language: (data.language as "pt" | "en") ?? "pt",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (patch: Partial<SettingsState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    if (!isApiConfigured()) return;
    await apiFetch("/settings", {
      method: "PATCH",
      body: {
        ...(patch.reminder_enabled !== undefined && { reminder_enabled: patch.reminder_enabled }),
        ...(patch.reminder_time !== undefined && { reminder_time: patch.reminder_time }),
        ...(patch.preferred_category_slugs !== undefined && { preferred_category_slugs: patch.preferred_category_slugs }),
        ...(patch.language !== undefined && { language: patch.language }),
      },
    });
  }, []);

  const updatePushToken = useCallback(async (token: string | null) => {
    if (!isApiConfigured()) return;
    await apiFetch("/settings", {
      method: "PATCH",
      body: { expo_push_token: token },
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        loading,
        refreshSettings,
        updateSettings,
        updatePushToken,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
