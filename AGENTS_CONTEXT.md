## InSelf Mobile - Contexto para Agentes LLM

### Visao geral do app
`inself-mobile` e o app mobile de saude mental "InSelf", focado em:
1. Reflexao diaria guiada por uma "jornada" (3 etapas: identifique, aceite, aja).
2. Check-in emocional diario (escolha de uma emocao inicial).
3. Check-out emocional ao finalizar a jornada (melhor/igual/pior).
4. Favoritos e historico de reflexoes.
5. Badges baseados na contagem de reflexoes completadas.
6. Desafios filosoficos (multi-dias) com progresso em UI.
7. Notificacoes in-app (usadas como trilha historica) e push notifications (lembrete diario).
8. Tema (light/dark) e preferencias (ate 3 categorias preferidas; idioma pt/en).

### Stack e ferramentas
- Expo + React Native + TypeScript
- Expo Router (rotas file-based em `app/`)
- NativeWind/Tailwind (estilo via classes `className`)
- AsyncStorage (persistencia local para modo demo e armazenamento de estado in-app)
- JWT via API REST (Node/Express + PostgreSQL em **repositorio separado**; este repo e so o app)
- Expo Notifications (push + listener para registrar notificacoes in-app)
- i18n "manual" (pt/en via arrays e funcoes no `lib/`; nao usa library externa)

### Estrutura de pastas (alto nivel)
- `app/`: rotas do Expo Router
  - `app/_layout.tsx`: providers globais + stack (sem header)
  - `app/index.tsx`: redireciona para `/(tabs)` se logado, senao para `/auth`
  - `app/auth.tsx`: login/cadastro e setup opcional de perfil
  - `app/(tabs)/`: telas das abas
    - `index.tsx`: tela Home (reflexao diaria + check-in/out + share)
    - `challenges.tsx`: lista de desafios
    - `virtues.tsx`: painel de virtudes (atualmente sem calculo efetivo de pontos)
    - `history.tsx`: historico de reflexoes (com filtro de favoritos)
    - `favorites.tsx`: lista de reflexoes favoritas (com expand para mostrar jornada)
    - `notifications.tsx`: central in-app de notificacoes
    - `settings/index.tsx`: perfil/configuracoes (tema, idioma, reminder e categorias)
    - `settings/account-details.tsx`: edicao de nome/genero/data nascimento
    - `settings/reminder-time.tsx`: hora do lembrete diario
  - `app/challenges/[id].tsx`: detalhe de um desafio (progresso em state local)
- `components/`: componentes reutilizados (header, check-in emocional, push, cards)
- `contexts/`: providers de estado
  - `AuthContext.tsx`, `ThemeContext.tsx`, `SettingsContext.tsx`, `ReflectionsContext.tsx`, `NotificationsContext.tsx`
- `lib/`: camadas de dominio e integracao
  - `api.ts`: client HTTP com token JWT (modo demo quando API nao esta configurada)
  - `badges.ts`: regras de badges e utilitarios de localizacao
  - `dailyReflections.ts`: geracao de reflexao diaria por data e categorias; dados (quote/author/steps)
  - `emotionalJourney.ts`: check-in/out emocional (API ou demo local)
  - `reflectionHistory.ts`: historico e favoritas (API ou demo local)
  - `challenges.ts`: catalogo de desafios e prompts por dia (pt/en)
  - `virtues.ts`: dados de virtudes (icon, limites; sem progresso persistido efetivo)
  - `registerPushNotifications.ts`: obtencao de token Expo push e configuracao de canal
  - `notificationsStorage.ts`: persistencia local das notificacoes in-app
  - `icons.tsx`, `themeDark.ts`, `design-tokens.ts`: tokens e icons
- **API e banco:** nao estao neste repositorio. O app so consome HTTP (`EXPO_PUBLIC_API_URL`). Migrations e servidor ficam no projeto do backend.

### Como o app decide entre modo demo e modo API real
- `lib/api.ts` usa `EXPO_PUBLIC_API_URL` (var do EXPO) para decidir baseUrl.
- Se baseUrl estiver vazio:
  - `isApiConfigured()` retorna falso.
  - Fluxos de auth e dominio caem para "mock/demo" usando AsyncStorage (token ficticio e dados locais).

### Arquitetura de integracoes e providers (fluxo principal)
1. `app/_layout.tsx`
   - Monta providers globais:
     - `AuthProvider` (carrega user via token e consulta /auth/me; e mantem `checkinCount`)
     - `ThemeProvider` (light/dark com sincronizacao opcional em /settings)
     - `SettingsProvider` (carrega idioma e preferencias em /settings; atualizacoes via PATCH /settings)
     - `ReflectionsProvider` (aciona um "refresh trigger" para atualizar historico/favoritos)
     - `NotificationsProvider` (carrega e persiste notificacoes in-app em AsyncStorage)
   - Monta componentes:
     - `NotificationReceivedListener`: listener do `expo-notifications` que salva notificacoes recebidas
     - `PushNotificationRegistration`: registra permissao e salva token expo ao backend quando logado
2. `app/index.tsx`
   - Observa `AuthContext.user` e redireciona:
     - user existente -> `/(tabs)`
     - sem user -> `/auth`

### Auth (user, token e contador)
- `AuthContext.tsx`
  - Carrega token via `AsyncStorage` (`inself-api-token`) e chama `GET /auth/me` para user.
  - Mantem `checkinCount` consultando `GET /checkin-count`.
  - Metodos:
    - `signIn(email, password)` -> `POST /auth/login` -> salva token
    - `signUp(email, password, full_name)` -> `POST /auth/register` -> salva token
    - `signInWithGoogle(idToken)` -> `POST /auth/google` (no app ha comentarios indicando que esta desativado temporariamente)
    - `signOut()` -> remove token e limpa user

### Dominios de dados
#### Reflexao diaria (Home)
- Local: `app/(tabs)/index.tsx`
- Geracao de "daily reflection":
  - Base em `getDailyReflection(preferredCategories, language)` no `lib/dailyReflections.ts`.
  - A tela tambem cria um "snapshot" diario por (userId + UTC-dateKey) em AsyncStorage:
    - chave: `inself.homeDailySnapshot.v1.${userId}.${todayUtcKey}`
  - Para consistencia de idioma: se snapshot foi gerado em outro idioma, a tela remonta textos no idioma atual via `getDailyReflectionByCategoryVirtue`.
- Persistencia e atualizacao:
  - Check-in emocional inicial: `saveEmotionalCheckin()` -> `POST /emotional-checkin` ou AsyncStorage (demo)
  - Check-out emocional final:
    - `saveEmotionalCheckout()` -> `POST /emotional-checkout` (backend)
  - Salvar reflexao:
    - `saveReflection()` -> `POST /reflections` (backend) ou AsyncStorage (demo)
  - Favoritar:
    - `toggleFavorite()` -> `POST /reflections/:id/favorite` ou alterna em AsyncStorage (demo)
  - Compartilhar:
    - gera imagem via `react-native-view-shot` e compartilha via `expo-sharing` (ou `Share.share` como fallback).

#### Historico e Favoritos
- Historico: `app/(tabs)/history.tsx`
  - Busca `getReflectionHistory()` -> `GET /reflections` ou AsyncStorage (demo)
  - Atualiza ao usar `ReflectionsContext.refreshTrigger`
  - Alterna favorito com `toggleFavorite()`
  - Exibe jornada quando expandida
- Favoritos: `app/(tabs)/favorites.tsx`
  - Busca `getFavorites()` -> `GET /favorites` ou filtra AsyncStorage (demo)
  - Exibe similar ao historico, com expand para jornada.

#### Badges
- Regras: `lib/badges.ts`
  - `BADGES` tem thresholds `requiredCheckins`.
  - Localizacao pt/en e utilitarios:
    - `getEarnedBadges(count, language)`
    - `didEarnNewBadge(oldCount, newCount, language)`
    - `getCurrentBadge(count, language)` e `getNextBadge(count, language)`
- Backend tambem envia badge metadata dinamica ao responder `GET /reflections`, `GET /favorites` e `POST /reflections`.

#### Desafios
- Catalogo: `lib/challenges.ts` (definicoes multi-dias com prompts pt/en)
- Tela lista: `app/(tabs)/challenges.tsx`
  - Renderiza `CHALLENGES` e navega para `/challenges/[id]`
- Tela detalhe: `app/challenges/[id].tsx`
  - Progresso atual e apenas state local:
    - `currentDay` e `completedDays` nao sao persistidos em API ou AsyncStorage.
  - Ao completar um dia:
    - salva texto localmente (na state)
    - registra uma notificacao in-app via `addNotification(type="challenge_phase")`
    - se for o ultimo dia, volta pra tela anterior.

#### Notificacoes in-app e push
- Storage in-app: `lib/notificationsStorage.ts`
  - chave: `@inself/notifications`
  - tipos: `emotional_checkin`, `reflection`, `checkout`, `challenge_phase`, `badge`, `reminder`
- Provider: `contexts/NotificationsContext.tsx`
  - `addNotification()` preprende item e persiste.
  - `markAsRead()` e `markAllAsRead()` atualizam o estado e reescrevem storage.
- Push:
  - `lib/registerPushNotifications.ts` registra canal Android e chama `Notifications.getExpoPushTokenAsync({projectId})`.
  - No **servidor da API** (repo separado) costuma existir um job que verifica `user_settings.reminder_time` e envia push diario via Expo.
  - `components/NotificationReceivedListener.tsx` captura notificacoes recebidas no app e salva como `type="reminder"`.

### Contrato da API (rotas usadas no app)
Baseado na implementacao historica da API e no uso em `lib/`:
- Auth
  - `POST /auth/register` (anon, sem JWT)
  - `POST /auth/login` (anon, sem JWT)
  - `GET /auth/me` (JWT)
  - `POST /auth/google` (JWT nao necessario, mas requer client IDs no servidor)
- Perfil
  - `GET /profile` (JWT)
  - `PATCH /profile` (JWT)
- Settings
  - `GET /settings` (JWT)
  - `PATCH /settings` (JWT)
- Check-in count
  - `GET /checkin-count` (JWT)
- Reflexoes
  - `GET /reflections` (JWT)
  - `POST /reflections` (JWT)
  - `POST /reflections/:id/favorite` (JWT)
  - `GET /favorites` (JWT)
- Jornada emocional
  - `GET /emotional-checkin/today?date=YYYY-MM-DD` (JWT)
  - `POST /emotional-checkin` (JWT): body {emotion_slug, date}
  - `POST /emotional-checkout` (JWT): body {emotion_slug}
- Health e jobs:
  - `GET /health`
  - endpoints de debug/trigger de job de push (ex: `/trigger-reminder-push`)

### Pontos de atencao / possiveis lacunas (para agentes)
- `app/(tabs)/virtues.tsx`
  - `virtuePoints` esta vazio, entao o progresso de virtudes aparenta nao estar implementado.
- `app/challenges/[id].tsx`
  - progresso do desafio nao e persistido entre sessoes/navegacoes.
- Persistencia de token JWT:
  - token e salvo em AsyncStorage (`inself-api-token`), nao em SecureStore/Keychain.
  - para producao, considerar SecureStore.
- `lib/reflectionHistory.ts`
  - em modo demo, usa `crypto.randomUUID?.()`.
  - dependendo do runtime, `crypto` global pode nao existir; isso pode causar crash em demo.
- Integracao Google:
  - ha comentario de desativacao temporaria no app (client IDs e "Entrar com Google" nao garantidos).

### Como contribuir / alterar comportamento
1. Se mexer em regras de dominio, preferir alterar `lib/*`.
2. Se mexer em persistencia/offline, alterar `lib/*` e/ou `contexts/*`.
3. Se mexer em API, alterar o **repositorio do backend** e atualizar contrato em `lib/api.ts` e demais chamadas.
4. Para novos fluxos de notificacao in-app, usar `NotificationsContext.addNotification` com um novo `type` e garantir que `notificationsStorage.ts` aceita o tipo.

