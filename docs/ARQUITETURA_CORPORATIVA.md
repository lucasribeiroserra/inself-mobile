# Arquitetura corporativa alvo — InSelf Mobile

Documento de **direção técnica** (visão “enterprise”): testável, desacoplada, i18n formal, tokens em SecureStore, refresh com retry de pedidos após 401.

**Relação com outros docs:** complementa `PLANO_ARQUITETURA.md`. A implementação deve ser **faseada**; o backend precisa expor contratos explícitos (secção 5). **Tokens de UI (cores, tipografia DS, regra “sem hex”):** [`docs/DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md).

---

## 1. Objetivos de qualidade

| Objetivo | Como |
|----------|------|
| **Testável** | Portas (interfaces) para HTTP e armazenamento de tokens; implementações falsas em testes; lógica de auth/refresh isolada e síncrona onde possível. |
| **Desacoplado** | UI e React Contexts não chamam `fetch` diretamente; dependem de serviços / hooks que por sua vez usam infraestrutura. |
| **i18n** | `i18next` + `react-i18next` + deteção de locale (`expo-localization`); chaves estáveis; ficheiros JSON por namespace. |
| **Segurança de sessão** | Access token + refresh token em **`expo-secure-store`**; nunca em logs; rotação de refresh no servidor. |
| **401 → refresh → retry** | Um único fluxo de renovação (**single-flight**); fila ou reexecução da petição original após novo access token. |
| **SOLID** | SRP por módulo; DIP: domínio/app depende de abstrações (`ITokenStore`, `IHttpClient` ou equivalente). |
| **KISS** | Evitar frameworks de DI pesados no início; **composition root** explícito (`createAppServices()`) costuma bastar. |

---

## 2. Camadas (visão em camadas)

```
app/ + components/     →  UI (Expo Router, apresentação)
        ↓ usa
hooks/ + features/     →  orquestração de ecrã (TanStack Query, handlers)
        ↓ usa
application/ ou lib/services/  →  casos de uso finos (opcional; pode viver em hooks)
        ↓ usa
domain/ (tipos + portas)       →  entidades, interfaces (ports)
        ↓ implementado por
infrastructure/        →  HttpClient, SecureTokenStore, i18n init
```

- **Domínio** no mobile costuma ser **leve** (mapeamento DTO ↔ modelo de ecrã); o grosso das regras pode continuar no backend.
- **Ports** mínimos recomendados:
  - `AuthTokenProvider` / `TokenReader` — lê access token para o header (e sinaliza se sessão existe).
  - `SessionRefresher` — executa refresh e persiste novo par (sem conhecer ecrãs).
  - `HttpClient` — `request(config)` com suporte a retry controlado.

---

## 3. Cliente HTTP e fluxo 401

### 3.1 Requisitos de comportamento

1. Todas as chamadas autenticadas levam `Authorization: Bearer <access>`.
2. Se a resposta for **401** e existir refresh token:
   - **Single-flight:** se já houver um refresh em curso, as outras petições **esperam** o mesmo `Promise` (evita N refreshes simultâneos).
   - Após refresh bem-sucedido: **repetir a petição original** com o novo access token (no máximo **1 retry** por pedido para evitar loop).
3. Se o refresh falhar (401/403 ou rede): **limpar sessão** (tokens), notificar camada de auth (logout / redirect para login), falhar as petições em fila com erro tipado.
4. **Timeouts** com `AbortSignal` (ex.: 30s configurável por ambiente).
5. Corpo de erro: classe **`ApiError`** com `status`, `code?`, `message`, `body?` (parse seguro de JSON vs texto).
6. **Sem loop infinito:** cada request autenticado pode tentar no máximo **1 retry** após refresh.
7. **Sem vazar segredos:** logs nunca devem imprimir `access_token` ou `refresh_token` (nem em modo debug de produção).
8. **Ordem de providers:** o `ThemeProvider` e `SettingsProvider` actuais ambos fazem `apiFetch("/settings")` ao montar, sem verificar se existe sessão activa (o utilizador pode não estar autenticado). Na arquitectura alvo, queries de `/settings` devem ser condicionadas a `user !== null` ou à existência de access token — evitando requests 401 desnecessários ao arrancar o app.

### 3.2 Implementação sugerida

- **`expo/fetch`** (SDK 54+) como transporte opcional para consistência WinterCG em nativo/web — alinhado à documentação Expo.
- Evitar acoplar a **Axios** só por interceptors: um wrapper em torno de `fetch` com a fila de refresh é suficiente e mantém bundle menor; Axios é aceitável se a equipa preferir middleware maduro.
- **Timeout obrigatório:** o cliente HTTP actual (`lib/api.ts`) não implementa nenhum timeout — um `fetch()` para um servidor que não responde congela o app indefinidamente. O `createHttpClient` deve usar `AbortController` com timeout configurável (sugestão: 15s default, 30s para uploads). Isto é crítico mesmo antes do single-flight existir.

### 3.3 Pseudocódigo do single-flight

```text
mutex = idle | refreshing(Promise)

on 401:
  if mutex == refreshing(p): await p; retry request once
  else:
    mutex = refreshing(doRefresh())
    await mutex
    if ok: persist tokens; retry request once
    else: clear session; reject all waiters
    mutex = idle
```

---

## 4. Tokens: SecureStore e expiração

### 4.1 Armazenamento

| Dado | Onde | Notas |
|------|------|--------|
| Access token | `expo-secure-store` | Chave por exemplo `inself.auth.access` |
| Refresh token | `expo-secure-store` | Chave separada `inself.auth.refresh` |
| Preferências não sensíveis | AsyncStorage | Tema, notificações in-app, snapshots de UX (como já documentado no plano) |

### 4.2 Expiração

- **Fonte de verdade:** o **servidor** valida `exp` do JWT.
- No cliente:
  - Opcional: descodificar **apenas** o payload do access (base64) para **pré-refresh proativo** (ex.: renovar 60s antes de expirar) — **sem** confiar nisso para segurança.
  - Obrigatório: tratar **401** com refresh + retry (secção 3).

### 4.3 Migração a partir do estado atual

- Hoje existe um único token em AsyncStorage (`lib/api.ts`). O alvo é **par de tokens** + SecureStore.
- Estratégia oficial: **migração direta** sem compatibilidade do token legado.
- Na primeira inicialização da versão com SecureStore:
  - limpar `inself-api-token` legado do AsyncStorage;
  - forçar novo login para obter `access_token` + `refresh_token` válidos.
- Eliminar fonte dupla de sessão (não manter AsyncStorage e SecureStore como fontes concorrentes).

### 4.4 Animações: migrar para Reanimated

O projecto instala `react-native-reanimated` v4.1 mas a Home (principal ecrã com animações) usa a `Animated` API legada do RN Core. Na arquitectura alvo:

- Bottom sheets e overlays devem usar `useSharedValue` + `useAnimatedStyle` + `withSpring`/`withTiming` do Reanimated para animações que correm na UI thread (worklets).
- Gestos de drag/dismiss devem usar `react-native-gesture-handler` (já instalado) compostos com Reanimated.
- Animar apenas `transform` e `opacity` (propriedades GPU-friendly); evitar animar `width`, `height`, `margin`.
- Esta migração deve ser feita na **Fase C** (refatoração da Home), não como pré-requisito das fases F.

---

## 5. Contrato da API (backend — obrigatório alinhar)

O backend será implementado com **autenticação completamente customizada** (decisão de produto: auto-hospedagem total, sem SaaS, escala >1M utilizadores). Não será usado Supabase Auth nem qualquer provider terceiro para gestão de sessões. O servidor deve implementar de raiz:

- Tabela `users` própria com `email`, `password_hash` (bcrypt/argon2), `full_name`, etc.
- Tabela `refresh_tokens` com `token_hash`, `user_id`, `expires_at`, `revoked_at`, `device_info` (opcional).
- Geração de JWT com `jsonwebtoken` (Node) ou equivalente, com claims `sub`, `iat`, `exp`, `iss`, `aud`.
- Rotação de refresh: cada uso do refresh token invalida o anterior e emite novo par.
- Validação de Google `id_token` via biblioteca oficial do Google.
- Rate limiting nos endpoints de auth.
- Cleanup periódico de refresh tokens expirados/revogados (cron job ou similar).

O backend deve expor, no mínimo:

| Endpoint | Função |
|----------|--------|
| `POST /auth/login` | Resposta: `{ access_token, refresh_token, expires_in?, token_type? }` + dados de utilizador (ou endpoints separados). |
| `POST /auth/register` | Idem ou apenas access + refresh conforme política. |
| `POST /auth/refresh` | Body: `{ refresh_token }` (ou cookie httpOnly se no futuro usarem web com cookies — mobile tipicamente body). Resposta: novo par access + refresh (**rotação** de refresh recomendada). |
| `POST /auth/logout` | *(Opcional mas recomendado)* invalidar refresh no servidor. Contrato recomendado: header `Authorization: Bearer <access_token>` + body opcional `{ refresh_token }`; se ambos existirem, validar consistência da sessão. |

**Segurança servidor:** refresh de uso único, revogação, rate limit em `/auth/refresh`, aud/iss consistentes nos JWT.

Sem estes contratos, o app **não pode** implementar retry+refresh de forma correta.

### 5.1 Segurança de auth a escala (>1M utilizadores)

| Aspecto | Recomendação |
|---------|-------------|
| **Hash de password** | bcrypt com cost factor >= 12 ou argon2id. Nunca SHA/MD5. |
| **Access token TTL** | 15 min (recomendado). Curto o suficiente para limitar impacto de leak; longo o suficiente para não sobrecarregar refresh. |
| **Refresh token TTL** | 30 dias (ajustável). Rotação obrigatória a cada uso. |
| **Refresh token storage** | Guardar apenas `hash(token)` no servidor; nunca o token em plain text. |
| **Limite de sessões** | Definir limite por utilizador (ex.: 5 dispositivos). Revogar sessão mais antiga ao exceder. |
| **Brute force** | Rate limiting (429) + lockout temporário após N tentativas falhadas por IP/email. |
| **Token revogação** | Tabela `refresh_tokens` com flag `revoked_at`. Em `/auth/logout`, revogar. Em troca de password, revogar todos. |
| **Timing-safe comparison** | Usar `crypto.timingSafeEqual` (Node) ao comparar hashes de refresh. |
| **Cleanup** | Cron job para apagar refresh tokens expirados (ex.: `DELETE WHERE expires_at < NOW()` diariamente). |

---

## 6. Estado de servidor: TanStack Query

- **`QueryClient`** com `defaultOptions` (`staleTime`, `retry` para rede, `networkMode` adequado a mobile).
- **`queryKey`** factory centralizada (`queryKeys.settings()`, `queryKeys.reflections.list()`).
- **Mutations** para login, guardar reflexão, favorito, PATCH settings — com `invalidateQueries` ou `setQueryData` otimista quando fizer sentido.
- **Separar** “estado de servidor” (Query) de “estado de UI local” (modais, scroll).
- **Unificação `settings/theme`:**
  - ter **uma fonte de verdade** para `/settings` (query `settings`);
  - `theme` e `language` devem derivar desse estado e atualizar via mutation única;
  - evitar dupla hidratação concorrente em `ThemeContext` e `SettingsContext`.

Documentação de referência: [TanStack Query — QueryClient defaultOptions](https://github.com/tanstack/query/blob/main/docs/framework/react/guides/migrating-to-react-query-3.md).

---

## 7. i18n

- **Stack:** `i18next` + `react-i18next` + `expo-localization` para `lng` inicial e mudança com preferência persistida (pode continuar a sincronizar com `/settings` se produto mantiver idioma no servidor).
- **Ficheiros:** `locales/pt/common.json`, `locales/en/common.json`, namespaces (`auth`, `errors`, `home`, …).
- **Regra:** nenhuma string visível ao utilizador em `Text` sem passar por `t('…')` (exceto nomes próprios).
- **Datas:** `date-fns` com locale importado conforme `i18n.language` (já usam date-fns no projeto).

---

## 8. Testes

| Nível | Ferramenta | Foco |
|-------|------------|------|
| Unitário | Jest | `SessionRefresher`, parse de `ApiError`, queryKey factories |
| Integração de hooks | React Native Testing Library | Ecrãs com QueryClient de teste + mocks |
| Contrato HTTP | Opcional | Pact / testes contra mock server em CI (backend) |

**Mocks:** implementações em memória de `TokenStore` e `HttpClient` injetadas no composition root de teste.

---

## 9. Estrutura de pastas sugerida (alvo)

```
src/   (ou manter raiz atual gradualmente)
  app/                 # Expo Router (inalterado conceitualmente)
  components/
  features/
    auth/
    reflections/
  infrastructure/
    http/
      createHttpClient.ts
      authRefreshMiddleware.ts   # ou integrado
      ApiError.ts
    storage/
      secureTokenStore.ts
  domain/
    ports/
      TokenStore.ts
      HttpClient.ts
  i18n/
    index.ts
    locales/
  test/
    mocks/
```

*Nota:* pode-se introduzir `src/` numa migração ou evoluir `lib/` → `infrastructure/` + `domain/` sem renomear tudo de uma vez (alias `@/` já existe).

---

## 10. Ordem de implementação recomendada

1. **Contrato backend** — refresh + resposta com par de tokens (bloqueante para validação end-to-end).
2. **PR-F.2:** ports + cliente HTTP + `ApiError` + single-flight no modelo final `access+refresh`.
3. **PR-F.3:** SecureStore + `AuthContext` com `access_token`/`refresh_token` + política de migração legado.
4. **Remoção completa do demo (A.4)** — auth, domínio e UI sem `demo-user`/fallbacks.
5. **TanStack Query** — migrar leituras críticas e **unificar `settings/theme` em fonte única**.
6. **i18n** — namespace `errors` + `auth` primeiro; depois restantes ecrãs.
7. **Refatorar Home** e features incompletas (virtudes/desafios) com a mesma stack.

> Esta ordem deve permanecer alinhada com `PLANO_ARQUITETURA.md` e `FASES_STEPS_E_CHECKLIST_PR.md`.

---

## 11. Riscos e decisões a fechar com produto/backend

- **Duração do access token** (curto = mais refresh; longo = menos mas mais impacto se roubado).
- **Rotação de refresh** e limite de dispositivos/sessões.
- **OAuth Google:** onde entra o refresh (mesmo modelo de par de tokens).
- **~~Clareza schema vs API~~** — **DECIDIDO (1.4 no PLANO_ARQUITETURA):** auth completamente customizada, sem Supabase Auth. Schema SQL (`supabase/migrations/001_initial_schema.sql`) deve ser reescrito com tabela `users` própria, `refresh_tokens`, e autorização na camada da API em vez de RLS com `auth.uid()`. A reescrita do schema faz parte do **PR-F.1**.
- **Dependências não instaladas:** `expo-secure-store`, `@tanstack/react-query`, `i18next`, `react-i18next`, `expo-localization` são mencionadas nos docs mas ausentes do `package.json`. Instalar cada uma no PR correspondente (F.2, F.4, F.5).
- **`darkMode: "media"` vs toggle manual:** o `tailwind.config.js` usa `darkMode: "media"` que conflita com o toggle manual do `ThemeContext`. Trocar para `"class"` na Fase D.5.

---

---

## 12. Notas da auditoria de código (2026-03-19)

Auditoria identificou 12 riscos adicionais documentados em `PLANO_ARQUITETURA.md` secção 2.3.1. Os mais relevantes para esta arquitectura:

| Risco | Impacto | Fase de resolução |
|-------|---------|-------------------|
| Sem timeout em `fetch()` | App congela em rede instável | F.2 |
| Dark mode triplicado (3 fontes de verdade) | Paleta inconsistente | Migração de tokens |
| `darkMode: "media"` vs toggle manual | Toggle do utilizador pode ser sobrescrito | D.5 |
| `useColorScheme` vs `useTheme` no TabLayout | Tabs dessincronizadas | D.4 |
| Animated API legada (não Reanimated) | Animações na JS thread | C.4 |
| Stale closure em NotificationsContext | Notificações perdidas em chamadas rápidas | D.3 |
| Contextos sem rollback em erro | Estado local diverge do servidor | F.4 |
| Providers fazem fetch sem sessão activa | Requests 401 desnecessários | F.4 |

*Documento vivo: atualizar quando o contrato da API estiver fechado.*
