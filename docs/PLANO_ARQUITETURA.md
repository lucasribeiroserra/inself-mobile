# Plano de arquitetura — InSelf Mobile

**Status:** planejamento (nenhuma mudança de código foi feita com base neste documento além da existência deste arquivo).  
**Objetivo:** registrar análise do estado atual e mudanças planejadas antes de refatorar o app.

---

## 1. Contexto do produto

- App de saúde mental com reflexão diária guiada, check-in/check-out emocional, histórico, favoritos, badges, desafios e perfil/configurações.
- **Backend e banco** estão em repositório separado; o app consome apenas HTTP (`EXPO_PUBLIC_API_URL`).
- **Modo demo removido (decisão de produto):** ver secção 1.1.

### 1.1 Decisão de produto: remover o modo demo

| Campo | Conteúdo |
|--------|-----------|
| **Decisão** | Não manter mais o fluxo "sem API" em que auth, reflexões, favoritos e jornada emocional usam dados mockados / só AsyncStorage. |
| **Aprovado com** | Head de produtos (alinhamento explícito). |
| **Data** | 2026-03-19 *(ajustar se necessário)* |
| **Motivação** | Um único comportamento alinhado à API real; menos código duplicado; menos risco de divergência entre demo e produção; simplifica onboarding de dev (sempre configurar `EXPO_PUBLIC_API_URL` ou falhar de forma clara). |
| **Impacto esperado no código** *(quando implementado)* | Remover `isApiConfigured()` como "atalho feliz" para demo; exigir URL da API no build/runtime; eliminar branches AsyncStorage-only em `lib/reflectionHistory`, `lib/badges`, `lib/emotionalJourney`; ajustar `AuthContext` e telas que hoje assumem login sem token real; mensagens de erro/onboarding focadas em "configure a API". |
| **O que não muda com esta decisão** | O pacote `@react-native-async-storage/async-storage` continua pertinente para outras funções (ver 1.2). |

### 1.2 AsyncStorage após remover o demo — ainda é necessário?

**Sim.** O [AsyncStorage foi removido do core do React Native](https://reactnative.dev/docs/asyncstorage); o projeto já usa corretamente o pacote da comunidade **`@react-native-async-storage/async-storage`**. Remover o **modo demo** não elimina a necessidade de **persistência local** para itens abaixo:

| Uso atual | Ficheiro / área | Continua após remover demo? | Nota |
|-----------|------------------|-------------------------------|------|
| Token JWT (`inself-api-token`) | `lib/api.ts` | **Sim** (estado atual) | Será removido por **migração direta** na Fase F; alvo final: apenas `access_token` + `refresh_token` em SecureStore. |
| Tema light/dark | `contexts/ThemeContext.tsx` | **Recomendado sim** | Cache/hidratação antes da API responder ou offline breve; pode ser repensado se tema vier **só** do servidor e aceitares flash sem tema. |
| Snapshot da reflexão do dia (chave por utilizador + data UTC) | `app/(tabs)/index.tsx` | **Sim** (comportamento de produto) | Garante jornada "travada" no dia; não é demo — é estado local de UX. |
| Lista de notificações in-app | `lib/notificationsStorage.ts` | **Sim** | Histórico local; não substituído pela API neste desenho atual. |

**Código que deixa de precisar de AsyncStorage** quando o demo for removido de facto:

| Uso | Ficheiro | Motivo |
|-----|----------|--------|
| Histórico de reflexões em demo | `lib/reflectionHistory.ts` | Passa a ser só API. |
| Contagem de check-ins / último dia em demo | `lib/badges.ts` | Passa a ser só API (`/checkin-count` + servidor). |
| Check-in emocional do dia em demo | `lib/emotionalJourney.ts` | Passa a ser só API. |

**Conclusão:** manter a dependência **AsyncStorage** no projeto para dados não sensíveis; remover token deste storage na migração direta da Fase F.

### 1.3 Visão corporativa (enterprise)

Direção acordada para evolução do app: **alta qualidade, testável, desacoplado**, **i18n formal**, **access + refresh em SecureStore**, **retry automático após 401** com refresh single-flight, camadas claras e **TanStack Query** para estado de servidor.

**Documento detalhado:** [`docs/ARQUITETURA_CORPORATIVA.md`](./ARQUITETURA_CORPORATIVA.md) (contrato backend, pastas alvo, fases de implementação).

**Dependência crítica:** o repositório da API deve suportar **refresh token** e endpoint dedicado; sem isso, o cliente não pode cumprir o fluxo enterprise descrito.

### 1.4 Decisão de infraestrutura: auth customizada (sem Supabase Auth)

| Campo | Conteúdo |
|--------|-----------|
| **Decisão** | Backend com autenticação completamente customizada (JWT próprio, tabela `users` própria, refresh tokens geridos pelo servidor). Sem dependência de Supabase Auth ou qualquer SaaS de autenticação. |
| **Aprovado com** | Produto + eng. (alinhamento explícito). |
| **Data** | 2026-03-19 |
| **Motivação** | Auto-hospedagem total sem dependência de SaaS; visão de escala >1M utilizadores; controlo total sobre JWT (claims, expiração, rotação); portabilidade de infraestrutura (VPS, cloud própria); pricing previsível a longo prazo. |
| **Impacto no schema** | O ficheiro `supabase/migrations/001_initial_schema.sql` referencia `auth.users` (Supabase Auth) e usa `auth.uid()` nas RLS policies. **Todo o schema deve ser reescrito** para: tabela `users` própria com `password_hash`; tabela `refresh_tokens` (hash, user_id, expires_at, revoked); RLS substituído por autorização na camada da API; trigger `on_auth_user_created` substituído por lógica no serviço de registo. |
| **Impacto no backend** | Implementar de raiz: hash de password (bcrypt/argon2), geração de JWT (access + refresh), rotação de refresh com revogação, validação de Google `id_token`, rate limiting em `/auth/*`, cleanup de tokens expirados. |
| **Impacto no mobile** | Nenhum impacto adicional — a arquitectura de ports (`TokenStore`, `HttpClient`) desenhada nas Fases F.2/F.3 é agnóstica ao provider de auth. O app consome endpoints REST e armazena tokens em SecureStore independentemente de quem os gera. |
| **O que muda nos docs** | `PROMPT_BACKEND_IMPLEMENTACAO.md` passa a especificar auth customizada como requisito; schema de referência deve ser reescrito sem `auth.users`; `ARQUITETURA_CORPORATIVA.md` remove ambiguidade Supabase vs custom. |

---

## 2. Estado atual da estrutura

### 2.1 Pastas e responsabilidades

| Área | Pasta | Papel |
|------|--------|--------|
| Rotas | `app/` | Expo Router (file-based): auth, tabs, challenges dinâmicos |
| UI reutilizável | `components/` | Header, check-in/out, share card, push, switch |
| Estado global | `contexts/` | Auth, tema, settings, refresh de reflexões, notificações in-app |
| Domínio + API | `lib/` | Cliente HTTP, reflexões, jornada emocional, badges, conteúdo diário, desafios, virtudes (dados), push helpers |
| Estilo | NativeWind + `global.css` | Classes `className`; complemento com `themeDark` / StyleSheet onde necessário — **tokens e regras de DS:** [`docs/DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md) |

### 2.2 Pontos fortes

- Separação clara entre **rotas** (`app/`), **estado compartilhado** (`contexts/`) e **regras + I/O** (`lib/`).
- Cliente API centralizado (`lib/api.ts`) — *hoje ainda com `isApiConfigured()` e ramos demo; serão removidos conforme decisão 1.1.*
- Fluxo de autenticação e settings alinhados com endpoints REST.
- Notificações in-app com persistência local e integração com push (token -> API).

### 2.3 Riscos e dívidas técnicas (já mapeados)

1. **Telas muito grandes** — principalmente a Home (`app/(tabs)/index.tsx`): ~900 linhas, 20+ variáveis de estado, animações inline, lógica de negócio misturada com UI; difícil testar e evoluir.
2. **Re-renders por contexto** — providers com objetos `value` grandes podem causar re-renders amplos; monitorar performance conforme o app cresce.
3. **Fontes de verdade duplicadas** — exemplo: contagem de reflexões (`checkinCount` no Auth vs estado local na Home em alguns fluxos); documentar canonicidade.
4. **Features incompletas na UI**
   - **Virtudes:** progresso não ligado a dados reais (ex.: `virtuePoints` vazio).
   - **Desafios:** progresso só em state local; não persiste entre sessões.
5. **Segurança:** JWT em AsyncStorage — aceitável em MVP; para produção, avaliar **Expo SecureStore** (ou estratégia equivalente).
6. **i18n:** strings espalhadas (pt/en manual); escalar para mais idiomas ou mais cópias pode exigir biblioteca (ex. i18next).
7. **Modo demo** *(a eliminar):* ramos duplicados em `lib/*` + risco antigo de `crypto.randomUUID` só no caminho demo — desaparece com a remoção do demo (decisão 1.1).

#### 2.3.1 Riscos adicionais identificados na auditoria de código (2026-03-19)

8. **Sem timeout em requisições HTTP** — `lib/api.ts` usa `fetch()` sem `AbortController`; se o servidor travar, o app congela indefinidamente. Resolver na **PR-F.2** com timeout configurável (10-15s API, 30s uploads).
9. **Dark mode triplicado e frágil** — três fontes de verdade concorrentes:
   - `global.css` (variáveis CSS `.dark` em HSL)
   - `tailwind.config.js` (tokens `dark-*` em hex)
   - `lib/themeDark.ts` (objeto JS com hex)
   - Componentes usam `isDark ? darkColors.xxx : "#hex"` inline — qualquer mudança de paleta exige alterar 3 ficheiros + varrer hex nos componentes.
   Resolver consolidando em `lib/theme/palette.*.ts` conforme [`DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md).
10. **`darkMode: "media"` conflita com toggle manual** — `tailwind.config.js` usa `darkMode: "media"` (segue sistema), mas o app tem toggle manual via `ThemeContext` + `Appearance.setColorScheme()`. Se o sistema mudar o color scheme, pode sobrescrever a preferência do utilizador. **Ação:** trocar para `darkMode: "class"` com controlo explícito.
11. **`useColorScheme` vs `useTheme` no TabLayout** — `app/(tabs)/_layout.tsx` usa `useColorScheme()` do RN, enquanto todos os outros ecrãs usam `useTheme()` do contexto. As cores das tabs podem dessincronizar com o conteúdo. **Ação:** substituir por `useTheme()`.
12. **Animated API legada (não Reanimated)** — a Home usa `Animated` do RN Core para bottom sheets, mas o projeto instala `react-native-reanimated` v4.1. Migrar para `useSharedValue` + `useAnimatedStyle` + `withSpring`/`withTiming` para performance nativa e interruptibilidade (alinhado com best practices de animação RN).
13. **Stale closure em `NotificationsContext.addNotification`** — depende do estado `notifications` via closure, mas chamadas rápidas (ex.: reflexão + badge simultâneos) podem usar o array antigo, perdendo notificações. **Ação:** usar `setNotifications(prev => [item, ...prev])`.
14. **Contextos sem rollback em erro** — `SettingsContext.updateSettings()` e `ThemeContext.applyTheme()` fazem update otimista mas **não revertem** se a API falhar. Resolver na **F.4** com TanStack Query + `onError` rollback.
15. **Ordem de providers potencialmente problemática** — `ThemeProvider` (dentro de `AuthProvider`) faz `apiFetch("/settings")` ao montar sem saber se o utilizador está autenticado; `SettingsProvider` faz a mesma request duplicada. Resolver na **F.4** com query única de `/settings` condicionada a sessão ativa.
16. **Data formatada só em português na Home** — `format(new Date(), "d 'de' MMMM, yyyy", { locale: ptBR })` não respeita `language === "en"`. Resolver na **F.5** com locale dinâmico via `i18n.language`.
17. **Hex hardcoded em componentes** — `components/EmotionalCheckIn.tsx` define `const primaryColor = "#5A7A66"` no nível de módulo, violando a regra de [`DESIGN_SYSTEM_TOKENS.md`](./DESIGN_SYSTEM_TOKENS.md). Resolver durante migração de tokens.
18. **`getEmotionLabel` duplicada** — função idêntica em `EmotionalCheckIn.tsx` e `HomeScreen`; extrair para `lib/` ou hook compartilhado.
19. **Dependências do roadmap não instaladas** — `expo-secure-store`, `@tanstack/react-query`, `i18next`, `react-i18next`, `expo-localization` estão planeadas nos docs mas ausentes do `package.json`. Instalar no PR correspondente de cada fase.
20. **Schema SQL depende de Supabase Auth** — `supabase/migrations/001_initial_schema.sql` referencia `auth.users` e `auth.uid()`. Com a decisão 1.4 (auth customizada), todo o schema precisa ser reescrito para tabela `users` própria + `refresh_tokens` + autorização na API em vez de RLS. Resolver no **PR-F.1** (backend).

---

## 3. Princípios para as mudanças planejadas

1. **Refatorar por feature**, não "big bang" em todo o repositório.
2. **Alinhar contratos com a API** (incl. refresh token) de forma explícita — ver `ARQUITETURA_CORPORATIVA.md` secção 5.
3. **Preservar comportamento** visível ao usuário em cada entrega (incremental + testes manuais nas telas críticas).
4. **Documentar** no próprio PR/commit o que mudou em relação a este plano (checklist).
5. **Priorizar testabilidade** onde a lógica for crítica (auth, refresh, cliente HTTP).

### 3.1 Decisões fechadas para a migração (anti-gaps)

1. **Ordem oficial:** este documento + `FASES_STEPS_E_CHECKLIST_PR.md` são a referência de execução; o `ARQUITETURA_CORPORATIVA.md` deve espelhar a mesma ordem.
2. **Single-flight obrigatório:** qualquer implementação de refresh sem coordenação de concorrência (N refresh em paralelo) é considerada incompleta.
3. **Remoção de demo é total:** remover ramos `demo-user`, fallbacks de auth sem API e textos/fallbacks de demo em telas.
4. **Sessão alvo é apenas par de tokens:** `access_token` + `refresh_token` em SecureStore; sem janela de compatibilidade para token único legado.
5. **Fonte única de settings/theme:** `theme` e `language` passam por uma única fonte de verdade de servidor (Query/cache central), sem dupla hidratação concorrente em contexts diferentes.

---

## 4. Mudanças planejadas (backlog priorizável)

**Passo a passo detalhado + checklists para colar em PRs:** [`docs/FASES_STEPS_E_CHECKLIST_PR.md`](./FASES_STEPS_E_CHECKLIST_PR.md).

### Fase A — Documentação e higiene (baixo risco)

| # | Item | Descrição |
|---|------|-----------|
| A.1 | Manter `docs/PLANO_ARQUITETURA.md` atualizado | Revisar após cada fase concluída. |
| A.2 | Alinhar vocabulário | README / scripts / comentários: "API" vs "pasta backend" (já parcialmente feito). |
| A.3 | Checklist de ambiente | `.env.example` + nota clara: URL da API, device vs emulador. |
| **A.4** | **Remover modo demo** | Implementar decisão 1.1: API obrigatória, limpar `isApiConfigured` / branches locais de domínio; ecrã ou erro claro sem URL. |

### Fase B — Robustez e segurança (médio impacto)

| # | Item | Descrição |
|---|------|-----------|
| B.1 | ~~Token só em SecureStore~~ | **Absorvido pela Fase F** (par access+refresh + fluxo 401); ver `ARQUITETURA_CORPORATIVA.md`. |
| ~~B.2~~ | ~~Demo / IDs~~ | **Cancelado** com a remoção do modo demo (1.1); não há geração local de reflexão em demo. |
| B.3 | Tratamento de erros na API | Padronizar `ApiError`, rede e mensagens ao utilizador (integrar com i18n na Fase F). |

### Fase C — Refatoração da Home (alto valor, médio esforço)

| # | Item | Descrição |
|---|------|-----------|
| C.1 | Extrair hooks | Ex.: `useDailyReflectionSnapshot`, `useEmotionalCheckinSheet`, `useReflectionJourneyModal`, `useShareReflection`. |
| C.2 | Extrair subcomponentes | Cards, overlay de jornada, sheet de check-in, bloco de streak — arquivos em `components/home/` ou `features/home/`. |
| C.3 | Reduzir estado duplicado | Definir **uma fonte** para contagem/streak exibida na Home vs `AuthContext.checkinCount`. |
| C.4 | Migrar animações para Reanimated | Bottom sheets e streak da Home usam `Animated` do RN Core; migrar para `useSharedValue` + `useAnimatedStyle` + `withSpring`/`withTiming` do Reanimated (já instalado v4.1). |
| C.5 | Extrair `getEmotionLabel` duplicada | Função idêntica em `EmotionalCheckIn.tsx` e `HomeScreen`; mover para `lib/` ou hook partilhado. |

### Fase D — Contextos e performance (conforme necessidade)

| # | Item | Descrição |
|---|------|-----------|
| D.1 | Memoizar `value` dos providers | Onde `value` for objeto novo a cada render. |
| D.2 | Split de contexto | Ex.: notificações só onde precisa; ou store leve (Zustand/Jotai) para estado "quente". |
| D.3 | Corrigir stale closure em `NotificationsContext` | `addNotification` usa closure de `notifications`; trocar para `setNotifications(prev => [item, ...prev])`. |
| D.4 | Corrigir `useColorScheme` vs `useTheme` no TabLayout | `app/(tabs)/_layout.tsx` usa `useColorScheme()` do RN; substituir por `useTheme()` do contexto para sincronizar com toggle manual. |
| D.5 | Trocar `darkMode` para `"class"` | `tailwind.config.js` deve usar `darkMode: "class"` para respeitar toggle manual em `ThemeContext`. |

### Fase E — Completar produto (depende de produto + API)

| # | Item | Descrição |
|---|------|-----------|
| E.1 | Desafios persistentes | Modelar no backend OU AsyncStorage por usuário/challenge; sincronizar com API se existir endpoint. |
| E.2 | Virtudes com progresso real | Regra de negócio (pontos por reflexão/desafio) + API ou cálculo derivado do histórico local. |
| E.3 | ~~i18n~~ | **Movido para Fase F** (`ARQUITETURA_CORPORATIVA.md` secção 7). |

### Fase F — Plataforma corporativa (alto impacto, depende de API)

| # | Item | Descrição |
|---|------|-----------|
| F.1 | Contrato refresh | Backend: `POST /auth/refresh`, par access+refresh no login/register, rotação de refresh. |
| F.2 | Ports + infra | `TokenStore` (SecureStore), `HttpClient` com 401 + single-flight + retry da petição original. |
| F.3 | Auth | `AuthContext` / serviço de sessão persiste par; logout limpa segredos; migração desde token único. |
| F.4 | TanStack Query + unificação settings/theme | `QueryClient`, query keys, migração de leituras (`/settings`, `/reflections`, `/profile`, ...) e eliminação de dupla fonte para `theme`/`settings`. |
| F.5 | i18n | `i18next` + namespaces; remover strings hardcoded gradualmente. |
| F.6 | Testes | Jest + mocks de ports; testes do fluxo de refresh e `ApiError`. |

*Detalhe técnico:* ver [`docs/ARQUITETURA_CORPORATIVA.md`](./ARQUITETURA_CORPORATIVA.md).

---

## 5. Ordem sugerida de execução

1. **F.1** no backend (bloqueante para validação end-to-end de refresh).
2. **F.2** + **B.3** (cliente HTTP, `ApiError`, single-flight já no modelo final `access+refresh`).
3. **F.3** (sessão completa em SecureStore com `access_token` + `refresh_token`).
4. **A** (incl. **A.4** remoção completa do demo após auth nova estável).
5. **F.4** (TanStack Query) com **unificação de `settings` + `theme` em fonte única**.
6. **F.5** (i18n) em paralelo às telas que mais mudam.
7. **F.6** (testes) contínuo desde F.2 e obrigatório nos fluxos de refresh/logout.
8. **C** (refatoração Home) com a stack já alinhada.
9. **D** e **E** conforme necessidade e produto.

---

## 6. Critérios de "pronto" por fase

- **A:** Documentos e env refletem repo só-app + API externa.
- **A:** Sem resíduos demo (`demo-user`, fallback auth sem API, texto de demo em UI).
- **B:** Erros de rede e `ApiError` consistentes (integração com i18n na Fase F).
- **F:** Refresh+retry funcional com single-flight; tokens sensíveis só em SecureStore; sem dependência de token legado; Query para leituras principais; `settings/theme` unificados; i18n base instalado; testes do cliente auth.
- **C:** Home dividida em hooks/componentes; arquivo principal reduzido e legível; animações migradas para Reanimated; comportamento atual preservado.
- **D:** Medição (React DevTools / Profiler) ou ausência de jank em listas/modais críticos. Stale closure e `useColorScheme` corrigidos. `darkMode: "class"` em `tailwind.config.js`.
- **E:** Critérios definidos com produto (o que conta como "dia completo", "ponto de virtude", etc.).

---

## 7. O que não está no escopo imediato deste plano

- Reescrever navegação (Expo Router permanece).
- Trocar NativeWind por outro sistema de estilo sem necessidade clara.

**Nota:** a **Fase F** assume **evolução coordenada** do repositório da API (refresh token, etc.); o trabalho de backend não está neste repo, mas é pré-requisito — ver `ARQUITETURA_CORPORATIVA.md` secção 5.

---

## 8. Histórico de revisões

| Data | Autor | Notas |
|------|--------|--------|
| 2026-03-19 | Produto + eng. | Decisão 1.4: **auth customizada** (sem Supabase Auth). Motivação: auto-hospedagem, escala >1M, controlo total de JWT. Schema SQL a reescrever sem `auth.users`. |
| 2026-03-19 | Auditoria técnica | Secção 2.3.1: 12 riscos adicionais (timeout HTTP, dark mode triplicado, `darkMode: "media"`, `useColorScheme` vs `useTheme`, Animated legado, stale closure, rollback em erro, ordem de providers, data pt-only, hex hardcoded, `getEmotionLabel` duplicada, dependências ausentes). Novos itens C.4, C.5, D.3, D.4, D.5. Critérios de pronto C e D atualizados. |
| 2026-03-19 | Produto + eng. | Fecho de gaps: ordem única de migração (F.1 -> F.2/B.3 -> F.3 -> A.4 -> F.4), single-flight obrigatório, remoção total do demo, sessão final `access+refresh` em SecureStore e unificação `settings/theme` na Fase F. |
| 2026-03-19 | Produto + eng. | **Visão corporativa** (secção 1.3): novo doc `ARQUITETURA_CORPORATIVA.md` + **Fase F** no backlog (SecureStore com refresh, retry 401, Query, i18n, testes). |
| 2026-03-19 | Produto + eng. | Decisão documentada: **remover modo demo** (secção 1.1). Análise: **manter AsyncStorage** para token (até SecureStore), tema, snapshot da Home e notificações in-app. |
| (anterior) | — | Criação do documento; backend em repositório separado. |

---

*Última atualização: documento criado como base de planejamento; revisar antes de iniciar cada fase.*
