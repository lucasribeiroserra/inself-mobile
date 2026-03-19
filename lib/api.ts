import AsyncStorage from "@react-native-async-storage/async-storage";

const DEV_API_URL = "http://127.0.0.1:3000";
const API_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  (typeof globalThis !== "undefined" && (globalThis as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL) ||
  "";
const TOKEN_KEY = "inself-api-token";

function getApiUrl(): string {
  const url = API_URL.trim();
  if (url) return url.replace(/\/$/, "");
  if (typeof __DEV__ !== "undefined" && __DEV__) return DEV_API_URL;
  return "";
}

export function isApiConfigured(): boolean {
  return !!getApiUrl();
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { method?: string; body?: object } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const baseUrl = getApiUrl();
  if (!baseUrl) return { error: "API não configurada", status: 0 };
  const { method = "GET", body, ...rest } = options;
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    method,
    headers: { ...(await authHeaders()), ...(rest.headers as object) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data: T | undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const error = (data as { error?: string })?.error ?? res.statusText ?? "Erro";
    return { error, data, status: res.status };
  }
  return { data: data as T, status: res.status };
}
