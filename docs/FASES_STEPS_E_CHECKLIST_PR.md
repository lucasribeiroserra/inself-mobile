# Fases — passo a passo e checklist de PR

Complementa [`PLANO_ARQUITETURA.md`](./PLANO_ARQUITETURA.md). Use **um PR por entrega lógica**; os checklists abaixo colam-se na descrição do PR (GitHub/GitLab).

---

## Ordem sugerida de PRs (macro)

| # | PR / entrega | Fases / itens | Notas |
|---|----------------|---------------|--------|
| 1 | **API: refresh + contrato** | **F.1** (repo backend) | Bloqueia cliente enterprise. |
| 2a | **App: infra HTTP + tokens (F.2)** | **F.2** (+ **B.3** se `ApiError` entrar aqui) | Ver **PR-F.2** abaixo: módulos novos já no modelo final (`access+refresh`, sem compat legado). |
| 2b | **App: sessão access+refresh (F.3)** | **F.3** | Ver **PR-F.3** abaixo: `AuthContext`, limpeza `inself-api-token`, logout/hidratação (sem campo `token` legado). |
| 3 | **App: demo removido + env** | **A** (A.2, A.3, **A.4**) | Depois de login real estável. |
| 4 | **App: TanStack Query** | **F.4** | Migrar leituras; unificar `settings`/`theme`; ver [`DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md) (paleta ≠ modo). |
| 5 | **App: i18n base** | **F.5** (mínimo: `auth` + `errors`) | Pode avançar em paralelo ao PR 4. |
| 6 | **App: testes críticos** | **F.6** | Contínuo desde PR 2; PR dedicado quando cobrir refresh + `ApiError`. |
| 7 | **App: Home refatorada** | **C** | Hooks + componentes + fonte única de streak. |
| 8 | **App: performance contextos** | **D** | Só se houver necessidade medida. |
| 9 | **Produto: desafios / virtudes** | **E** | Depende de API/regras de produto. |
| 10 | **App: quick fixes (D.3-D.5)** | **D.3**, **D.4**, **D.5** | Stale closure, useColorScheme, darkMode. Pode entrar antes ou junto da Fase D. |

---

## Decisões operacionais (fonte de verdade)

1. **Ordem oficial:** seguir este documento e `PLANO_ARQUITETURA.md`. Em caso de conflito, ajustar os outros docs para espelhar esta ordem.
2. **Single-flight é obrigatório:** PR com refresh sem coordenação de concorrência não cumpre critério técnico.
3. **Demo removido por completo:** não basta bloquear login sem API; é necessário remover resíduos de `demo-user` e fallback textual/funcional de demo.
4. **Sessão final:** apenas `access_token` + `refresh_token` em SecureStore; sem compatibilidade para token legado.
5. **Settings/theme:** uma única fonte de verdade de servidor (query/cache central), sem dupla hidratação concorrente.
6. **Auth customizada (sem Supabase Auth):** decisão fechada — auto-hospedagem total, escala >1M utilizadores. Schema reescrito sem `auth.users`/RLS. Backend gere JWT, hash de password e refresh tokens de forma independente. Ver decisão 1.4 em `PLANO_ARQUITETURA.md`.

### Política de merge sem backend F.1 pronto

- **PR-F.2 não deve fechar sem F.1 em staging**, pois já adota o modelo final `access_token + refresh_token`.
- **PR-F.3 também depende de F.1 em staging**, para validar hidratação, refresh e logout no contrato definitivo.

---

## Checklist genérico (todo PR)

Copiar para a descrição de **qualquer** PR deste roadmap:

```markdown
## Checklist geral
- [ ] `npm run start` / build sem erros
- [ ] Fluxos manuais afetados testados (listar abaixo)
- [ ] Sem secrets commitados (`.env` fora do git)
- [ ] Documentação atualizada (`README` / `docs/` se aplicável)
- [ ] Tipo TypeScript sem erros novos (`npx tsc --noEmit` se usarem)
- [ ] Screenshots ou nota “N/A UI” na descrição do PR
```

---

## Fase A — Documentação e higiene

### Passo a passo

1. **A.1** — Após cada outra fase, rever `PLANO_ARQUITETURA.md` e este ficheiro; marcar histórico na secção 8 do plano se necessário.
2. **A.2** — Rever `README.md`, comentários em `scripts/`, strings de erro em `app/auth.tsx`: vocabulário “API” / sem referências a pasta `backend` removida.
3. **A.3** — Garantir `.env.example` na raiz com `EXPO_PUBLIC_API_URL=`, nota para dispositivo físico (IP da máquina) vs emulador (`localhost` / `10.0.2.2` Android).
4. **A.4** — Remover modo demo:
   - Remover ou endurecer `isApiConfigured()` (sem “modo feliz” sem URL em produção).
   - Remover branches AsyncStorage-only em `lib/reflectionHistory.ts`, `lib/badges.ts`, `lib/emotionalJourney.ts`.
   - Ajustar `AuthContext` (sem utilizador demo e sem branches `!isApiConfigured()` para autenticação).
   - Remover fallback visual de demo em UI (ex.: `demo@inself.app` em `app/(tabs)/settings/index.tsx`).
   - Ecrã ou bloqueio claro se `EXPO_PUBLIC_API_URL` vazio em release (ou falha explícita no arranque).

### Checklist de PR — *Fase A*

- [ ] **A.2** README + scripts alinhados ao repo só-app
- [ ] **A.3** `.env.example` completo e descrito no README
- [ ] **A.4** Sem ramos demo em `reflectionHistory`, `badges`, `emotionalJourney`
- [ ] **A.4** Auth sem login fictício; mensagens orientam configuração da API
- [ ] **A.4** Sem `demo-user` / `demo@inself.app` em `contexts/AuthContext.tsx` e `app/(tabs)/settings/index.tsx`
- [ ] Testado: cold start sem `.env` (comportamento acordado documentado)
- [ ] Testado: login + home + histórico com API real

---

## Fase B — Robustez (B.3; B.1 absorvido em F)

### Passo a passo (B.3)

1. Introduzir tipo/classe **`ApiError`** (`status`, `message`, `code?`, corpo parseado quando existir).
2. No cliente HTTP central: normalizar respostas não-JSON e timeouts; mapear para `ApiError` ou `{ error: string }` compatível com o app.
3. Nas telas ou hooks que mostram toast/alert: usar mensagem estável (chave i18n quando **F.5** existir).
4. Opcional: retry idempotente para GET em falhas de rede (alinhado a TanStack Query na **F.4**).

### Checklist de PR — *B.3*

- [ ] Erros de API não quebram com HTML/texto inesperado no body
- [ ] Timeout configurável documentado
- [ ] Nenhum `token` ou refresh em logs
- [ ] Teste manual: avião modo / API desligada → mensagem compreensível

---

## Fase C — Refatoração da Home

### Passo a passo

1. **C.1** — Extrair hooks (`useDailyReflectionSnapshot`, `useEmotionalCheckinSheet`, `useReflectionJourneyModal`, `useShareReflection`, …) para `hooks/home/` ou `features/home/hooks/`.
2. **C.2** — Extrair componentes (card reflexão, overlay jornada, sheet check-in, streak) para `components/home/` ou `features/home/components/`.
3. **C.3** — Definir fonte única para contagem/streak (ex.: só `AuthContext.checkinCount` ou só Query); remover estado duplicado na Home.
4. Garantir que `useFocusEffect` e snapshots AsyncStorage da Home mantêm o mesmo comportamento.
5. **C.4** — Migrar animações da Home (bottom sheets, streak) de `Animated` (RN Core) para Reanimated (`useSharedValue` + `useAnimatedStyle` + `withSpring`/`withTiming`). O projeto já instala `react-native-reanimated` v4.1 mas a Home usa a API legada.
6. **C.5** — Extrair função `getEmotionLabel` duplicada (existe idêntica em `EmotionalCheckIn.tsx` e `app/(tabs)/index.tsx`); mover para `lib/emotions.ts` ou hook partilhado.

### Checklist de PR — *Fase C*

- [ ] `app/(tabs)/index.tsx` reduzido (meta: < ~400 linhas ou por acordo de equipa)
- [ ] Nenhuma regressão: jornada 3 passos, check-in/out, partilha, favorito
- [ ] Streak / fire badge consistente com `checkinCount` global
- [ ] Testado em tema claro e escuro
- [ ] **C.4** Animações de bottom sheet e streak migradas para Reanimated (sem `Animated` do RN Core)
- [ ] **C.5** `getEmotionLabel` extraída para local único; removida duplicação

---

## Fase D — Contextos e performance

### Passo a passo

1. **D.1** — Auditar providers: `useMemo` no objeto `value` onde necessário.
2. **D.2** — Se profiler mostrar re-renders: dividir contexto ou mover estado “quente” para store leve (Zustand/Jotai) **só** onde medido.
3. **D.3** — Corrigir stale closure em `NotificationsContext.addNotification`: trocar para `setNotifications(prev => [item, ...prev])` em vez de depender da closure de `notifications`.
4. **D.4** — Substituir `useColorScheme()` do RN por `useTheme()` do contexto em `app/(tabs)/_layout.tsx` (TabLayout). Hoje usa fonte diferente de todos os outros ecrãs — pode dessincronizar cores das tabs com o conteúdo.
5. **D.5** — Trocar `darkMode: "media"` para `darkMode: "class"` em `tailwind.config.js`. O modo `"media"` segue a preferência do sistema e conflita com o toggle manual do `ThemeContext` via `Appearance.setColorScheme()`.

### Checklist de PR — *Fase D*

- [ ] Antes/depois documentado (Profiler ou motivo qualitativo)
- [ ] Nenhuma alteração funcional nas telas sem necessidade
- [ ] **D.3** `addNotification` usa `setNotifications(prev => ...)` em vez de closure
- [ ] **D.4** `app/(tabs)/_layout.tsx` usa `useTheme()` em vez de `useColorScheme()`; tabs sincronizadas com toggle manual
- [ ] **D.5** `tailwind.config.js` com `darkMode: "class"`; testado toggle manual light/dark

---

## Fase E — Produto (desafios / virtudes)

### Passo a passo

1. **E.1** — Com produto/backend: persistir progresso de desafios (API ou storage local por `userId`+`challengeId`).
2. **E.2** — Definir fórmula de pontos de virtudes; implementar fonte de dados (API ou derivado do histórico).
3. Atualizar `app/challenges/[id].tsx` e `app/(tabs)/virtues.tsx`.

### Checklist de PR — *Fase E*

- [ ] Critérios de produto referenciados (issue/doc)
- [ ] Dados persistem após kill da app
- [ ] Checklist de regressão nas tabs Desafios / Virtudes

---

## Fase F — Plataforma corporativa

### F.1 — Backend (repositório da API)

#### Passo a passo

1. `POST /auth/login` e `POST /auth/register` (e `POST /auth/google` se aplicável) devolvem **`access_token` + `refresh_token`**.
2. Implementar `POST /auth/refresh` com rotação de refresh e resposta com novo par.
3. (Opcional) `POST /auth/logout` invalida refresh (contrato recomendado: header `Authorization` + body opcional `{ refresh_token }`).
4. Rate limit e validação de `aud`/`iss` nos JWT.
5. Documentar env e atualizar [`PROMPT_BACKEND_IMPLEMENTACAO.md`](./PROMPT_BACKEND_IMPLEMENTACAO.md) se o contrato divergir.
6. **Reescrita do schema SQL** — o `supabase/migrations/001_initial_schema.sql` (legado) referencia `auth.users` e `auth.uid()` (Supabase Auth). Com auth customizada (decisão 1.4 do PLANO_ARQUITETURA), reescrever:
   - Tabela `users` própria com `password_hash` (bcrypt/argon2), `email_verified_at`, etc.
   - Tabela `refresh_tokens` com `token_hash` (nunca plain text), `expires_at`, `revoked_at`, `device_info`.
   - Remover todas as RLS policies (autorização passa a ser na camada da API, com `user_id` extraído do JWT).
   - Recriar trigger/lógica de criação de perfil+settings+streak no registo (hoje é trigger `on_auth_user_created`).
   - Índices para queries de alta frequência: `refresh_tokens(user_id, revoked_at)`, `user_reflections(user_id, completed_at DESC)`.

#### Checklist de PR — *F.1 (backend)*

- [ ] Refresh roda em staging; token antigo invalidado após rotação
- [ ] Login/register retornam contrato acordado com o mobile
- [ ] Logout (se exposto) tem contrato explícito e testado (header/body/códigos)
- [ ] Testes automatizados ou coleção Postman/Insomnia referenciada no PR
- [ ] `CHANGELOG` ou release note se aplicável
- [ ] Schema sem referências a `auth.users` / `auth.uid()` (auth customizada)
- [ ] Tabela `users` com `password_hash` (bcrypt cost >= 12 ou argon2id)
- [ ] Tabela `refresh_tokens` com `token_hash`; rotação testada; expirados limpos
- [ ] Autorização por `user_id` do JWT em todos endpoints protegidos (sem RLS)
- [ ] Lógica de criação de perfil/settings/streak no registo (substitui trigger Supabase)

---

### PR-F.2 — Infra HTTP + modelo final de tokens

**Objetivo:** introduzir camadas (`ports` + `infrastructure`) e um cliente HTTP preparado para **401 + refresh single-flight** já no modelo final com `access_token` + `refresh_token`.

**Pré-requisito:** **F.1** no backend em **staging** (alinha com a política de merge acima; sem exceção “só mocks”).

#### Consumidores atuais de `apiFetch` / `isApiConfigured` (regressão obrigatória)

| Ficheiro | Uso |
|----------|-----|
| `lib/api.ts` | `apiFetch`, `getStoredToken`, `setStoredToken`, `isApiConfigured` |
| `contexts/AuthContext.tsx` | login/register/google/me + tokens |
| `contexts/SettingsContext.tsx` | `GET`/`PATCH` `/settings` |
| `contexts/ThemeContext.tsx` | `GET`/`PATCH` `/settings` (tema) |
| `lib/reflectionHistory.ts` | reflexões, favoritos |
| `lib/emotionalJourney.ts` | check-in/out emocional |
| `lib/badges.ts` | `GET` `/checkin-count` |
| `app/(tabs)/settings/account-details.tsx` | `GET`/`PATCH` `/profile` |
| `app/auth.tsx` | `isApiConfigured` |

*Nenhum destes ficheiros precisa de alteração de imports na PR-F.2* se a **assinatura pública** de `lib/api.ts` se mantiver (`apiFetch`, `getStoredToken`, `setStoredToken`, `isApiConfigured`).

#### Passo a passo (paths exatos sugeridos)

1. **Dependência** — adicionar `expo-secure-store` em `package.json` (usada já na PR-F.2 pelo `secureTokenStore`).
2. **Port de tokens** — criar `lib/domain/ports/TokenStore.ts` com operações mínimas, por exemplo: `getAccessToken()`, `getRefreshToken()`, `setTokens({ access, refresh })`, `clear()`.
3. **Token store final (PR-F.2)** — criar `lib/infrastructure/storage/secureTokenStore.ts` que:
   - lê/escreve `access_token` e `refresh_token` em chaves separadas no SecureStore;
   - expõe API única para sessão (`getAccessToken`, `getRefreshToken`, `setTokens`, `clear`).
4. **Erros tipados** — criar `lib/infrastructure/http/ApiError.ts` (status, corpo, `code` opcional) alinhado à **B.3**.
5. **Cliente HTTP** — criar `lib/infrastructure/http/createHttpClient.ts` (ou `authenticatedHttpClient.ts`) que:
   - recebe `baseUrl`, `TokenStore`, `fetchImpl`;
   - anexa `Authorization: Bearer <access>`;
   - em **401**: se existir refresh, **single-flight** `POST /auth/refresh`, atualiza tokens via `TokenStore`, **repete o pedido uma vez**;
   - se refresh falhar ou não existir refresh: `clear()` + chamar callback `onSessionInvalidated` (no-op ou log na PR-F.2).
6. **Facade** — refatorar `lib/api.ts` para:
   - manter `getApiUrl()`, `isApiConfigured()`, `TOKEN_KEY` / exports usados por testes se necessário;
   - implementar `apiFetch` chamando o novo cliente (parse JSON como hoje, mapear erros para `{ error, status }` **ou** começar a expor `ApiError` — documentar no PR);
   - remover dependência operacional de `getStoredToken` / `setStoredToken`; se mantidos por compat de import, devem delegar ao `TokenStore` final.
7. **Testes (F.6 parcial)** — `lib/infrastructure/http/__tests__/createHttpClient.test.ts` (ou junto de `jest.config`): mocks de `fetch` + store; cenário **duas requisições 401 simultâneas → um refresh**.
8. **Documentação** — atualizar `docs/ARQUITETURA_CORPORATIVA.md` / `AGENTS_CONTEXT.md` só se a estrutura de pastas ficar definitiva; caso contrário nota no PR: “estrutura alvo em evolução”.

#### Checklist de PR — *PR-F.2* (granular)

**Estrutura e API pública**
- [ ] `lib/domain/ports/TokenStore.ts` criado e estável para PR-F.3
- [ ] `lib/infrastructure/storage/secureTokenStore.ts` criado e usado como fonte única de sessão
- [ ] `lib/infrastructure/http/ApiError.ts` criado
- [ ] `lib/infrastructure/http/createHttpClient.ts` com retry **uma vez** após refresh bem-sucedido
- [ ] `lib/api.ts` mantém exports esperados por `AuthContext` e restantes consumidores

**Comportamento**
- [ ] Dois `apiFetch` paralelos com 401 + refresh mockado → **uma** chamada a `/auth/refresh` (single-flight)
- [ ] Falha em `/auth/refresh` limpa sessão e sinaliza logout (sem loop infinito)
- [ ] Não logar tokens nem refresh em `console` em produção
- [ ] Timeout configurável com `AbortController` (default 15s; sem fetch infinito em rede travada)

**Regressão manual (checklist rápida)**
- [ ] `contexts/AuthContext.tsx` — login / me / logout
- [ ] `contexts/SettingsContext.tsx` + `contexts/ThemeContext.tsx` — carregar e gravar settings
- [ ] `lib/reflectionHistory.ts` — lista e gravar reflexão
- [ ] `lib/emotionalJourney.ts` — check-in do dia
- [ ] `lib/badges.ts` — contagem
- [ ] `app/(tabs)/settings/account-details.tsx` — perfil
- [ ] `app/auth.tsx` — fluxo com `isApiConfigured`

**Não é critério de aceite da PR-F.2**
- Migração de todas as telas para TanStack Query (isso é **F.4**)

---

### PR-F.3 — Sessão: SecureStore, par de tokens e `AuthContext`

**Objetivo:** alinhar `AuthContext` e fluxos de login/hidratação/logout ao contrato final (`access_token` + `refresh_token`) já preparado na PR-F.2.

#### Passo a passo (paths exatos)

1. **Composição em `lib/api.ts`** — confirmar `secureTokenStore` como store padrão do cliente HTTP.
2. **Limpeza legado obrigatória** — remover `inself-api-token` do AsyncStorage no arranque da versão (sem janela de compatibilidade) e forçar novo login quando necessário.
3. **`contexts/AuthContext.tsx`**
   - Tipos de resposta: apenas `access_token`, `refresh_token`.
   - `signIn`, `signUp`, `signInWithGoogle`: após sucesso, `tokenStore.setTokens({ access, refresh })`; remover dependência de `setStoredToken(data.token)`.
   - `signOut`: `tokenStore.clear()`; opcional `apiFetch('/auth/logout', { method: 'POST', body: { refresh_token } })` se F.1 incluir logout.
   - Hidratação no `useEffect` inicial: com access (ou só refresh), garantir `/auth/me` após refresh silencioso se necessário.
   - **Sessão invalidada:** registar listener (ex.: `lib/infrastructure/session/onSessionInvalidated.ts` + `EventEmitter` ou callback registado em `lib/api.ts`) para `setUser(null)` quando o cliente HTTP limpar tokens após refresh falhado.
4. **Remover dependência de token em AsyncStorage** — deprecar `getStoredToken`/`setStoredToken` em favor da API via `TokenStore` (evitar duas fontes de verdade).
5. **`docs/PLANO_ARQUITETURA.md`** (tabela 1.2) — atualizar linha do token: SecureStore em vez de AsyncStorage.
6. **`AGENTS_CONTEXT.md`** — atualizar descrição do armazenamento de sessão.
7. **Alinhamento com remoção de demo** — se **A.4** ainda não existir, não introduzir novo código demo; se já existir, não reintroduzir `demo-user` em `AuthContext.tsx`.

#### Checklist de PR — *PR-F.3* (granular)

**Armazenamento**
- [ ] `lib/infrastructure/storage/secureTokenStore.ts` implementa `TokenStore`
- [ ] Nenhum access/refresh novo fica em AsyncStorage
- [ ] `inself-api-token` legado removido e utilizador antigo é reautenticado

**Auth**
- [ ] `contexts/AuthContext.tsx` — `signIn` / `signUp` / `signInWithGoogle` persistem **ambos** os tokens quando a API devolve refresh
- [ ] `contexts/AuthContext.tsx` — `signOut` limpa SecureStore (e chama logout servidor se aplicável)
- [ ] Refresh falhou (401 em `/auth/refresh`) → utilizador deslogado na UI (`user === null`)
- [ ] Sem parsing de campo legado `token` em respostas de auth

**Integração HTTP**
- [ ] `lib/api.ts` usa `secureTokenStore` como store default do `createHttpClient`
- [ ] Pedido autenticado após access expirado: refresh + retry + sucesso (teste manual contra API **F.1**)

**Regressão**
- [ ] `refreshUser` e `refreshCheckinCount` após login
- [ ] `app/(tabs)/settings/account-details.tsx` — perfil com sessão renovada
- [ ] Mesma lista de consumidores da tabela PR-F.2 sem alteração de imports necessária

**Documentação**
- [ ] `docs/PLANO_ARQUITETURA.md` / `AGENTS_CONTEXT.md` coerentes com SecureStore

---

### F.4 — TanStack Query

#### Passo a passo

1. Instalar `@tanstack/react-query`; envolver app em `QueryClientProvider` (`app/_layout.tsx`).
2. Criar `queryKeys` centralizados.
3. **Unificar `settings/theme` antes de escalar migração de queries:**
   - definir query única para `/settings` (fonte de verdade para `theme` e `language`);
   - remover dupla hidratação concorrente entre `contexts/SettingsContext.tsx` e `contexts/ThemeContext.tsx`;
   - decidir modelo final: `SettingsContext` alimenta `ThemeContext` **ou** ambos consomem a mesma query.
   - alinhar com [`docs/DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md): modo light/dark ≠ definição de paleta (só estado).
4. Migrar `GET /settings`, `GET /reflections`, `GET /profile`, `GET /checkin-count`, `GET /auth/me` (se fizer sentido) para `useQuery`.
5. Migrar mutations: login (invalidar queries), salvar reflexão, favorito, `PATCH` settings — com `invalidateQueries` ou updates otimistas.
6. `defaultOptions`: `staleTime`, retry para rede.

#### Checklist de PR — *F.4*

- [ ] Sem double-fetch óbvio ao focar tabs (ajustar `staleTime`)
- [ ] `contexts/SettingsContext.tsx` e `contexts/ThemeContext.tsx` sem competição por `/settings`
- [ ] `theme` e `language` têm fonte única de verdade
- [ ] Lista de reflexões atualiza após salvar / favorito
- [ ] `QueryClient` partilhado em testes (provider de teste documentado)

---

## Matriz de remoção do demo (controlo por PR)

| PR | Estado permitido de demo |
|----|---------------------------|
| PR-F.2 | Pode manter código legado, mas não introduzir novos caminhos demo |
| PR-F.3 | Pode manter resíduos apenas se A.4 ainda não mergeou; não criar novos |
| PR-A (A.4) | **Obrigatório remover tudo** (`demo-user`, fallback email demo, branches auth/domínio sem API) |
| PRs após A.4 | Reintrodução de demo é regressão |

---

### F.5 — i18n

#### Passo a passo

1. Instalar `i18next`, `react-i18next`, usar `expo-localization` para `lng` inicial.
2. Criar `locales/pt/*.json`, `locales/en/*.json` (namespaces: `common`, `auth`, `errors`, …).
3. Substituir strings em fluxos críticos primeiro (`auth`, erros de rede, toasts).
4. Sincronizar com `PATCH /settings` `language` se o produto mantiver idioma no servidor.

#### Checklist de PR — *F.5*

- [ ] Troca PT/EN sem reload quebrar o app
- [ ] Novas strings não introduzem texto hardcoded nas áreas tocadas pelo PR
- [ ] `date-fns` locale alinhado ao `i18n.language` onde aplicável
- [ ] `date-fns` locale dinâmico na Home (data formatada respeita idioma selecionado, não só pt-BR fixo)

---

### F.6 — Testes

#### Passo a passo

1. Configurar Jest (se ainda não) para RN/Expo.
2. Testes unitários: `ApiError`, refresh single-flight, factories de `queryKeys`.
3. Testes de componente/hook: auth ou ecrã crítico com mocks de HTTP/token.
4. CI: correr testes no pipeline.

#### Checklist de PR — *F.6*

- [ ] `npm test` (ou script acordado) passa no CI
- [ ] Mocks não acoplam a URLs reais
- [ ] Cobertura mínima documentada para o módulo novo

---

## Resumo por letra de fase (para o título do PR)

| Fase | Título sugerido do PR |
|------|-------------------------|
| A | `chore: docs, env e remoção do modo demo` |
| B | `fix: erros de API normalizados (ApiError)` |
| C | `refactor(home): hooks e componentes da Home` |
| D | `perf: contextos e re-renders` |
| E | `feat: persistência desafios / virtudes` |
| F.1 | `feat(api): refresh token e rotação` *(backend)* |
| F.2 (PR-F.2) | `feat(app): ports, ApiError e HttpClient com access+refresh` |
| F.3 (PR-F.3) | `feat(app): SecureStore, par de tokens e AuthContext` |
| F.4 | `feat(app): TanStack Query para estado de servidor` |
| F.5 | `feat(app): i18next base` |
| F.6 | `test: refresh, ApiError e hooks críticos` |

---

*Atualizar este ficheiro quando uma fase for desdobrada em mais PRs.*
