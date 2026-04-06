# Prompt para agente LLM — implementação da API InSelf (backend)

Copie o bloco entre `---PROMPT---` abaixo e cole no agente responsável pelo backend. **Complete** a secção “Stack e repositório” com a vossa escolha tecnológica (Node, Go, etc.).

---

## ---PROMPT--- (início)

### Contexto

Precisas de implementar (ou completar) a **API REST** que serve a app mobile **InSelf** (React Native + Expo). O cliente chama uma `baseUrl` configurável (ex.: `https://api.exemplo.com` ou `http://localhost:3000`), envia JSON com `Content-Type: application/json` e, nas rotas protegidas, o header:

```http
Authorization: Bearer <access_token>
```

O cliente atual trata erros assim: corpo JSON com campo **`error`** (string) em falhas; status HTTP coerente (4xx/5xx). Respostas de sucesso em JSON salvo indicação em contrário.

**Nota de migração:** o app será migrado **diretamente** para `access_token` + `refresh_token`. Não devolver campo legado `token`.

**Decisão de auth (fechada):** o backend usa **autenticação completamente customizada** — sem Supabase Auth nem qualquer SaaS. Motivação: auto-hospedagem total, escala >1M utilizadores, controlo total sobre JWT e sessões. O ficheiro `supabase/migrations/001_initial_schema.sql` no repo mobile é **legado e deve ser reescrito**: substituir `auth.users` por tabela `users` própria com `password_hash`, substituir `auth.uid()` por autorização na API, e adicionar tabela `refresh_tokens`. Ver secção "Modelo de dados" abaixo.

---

### Autenticação e sessão (obrigatório alinhado com app futuro)

1. **Access token** (JWT de curta duração, recomendado) — enviado em `Authorization`.
2. **Refresh token** (rotação no servidor, armazenamento seguro no cliente) — usado apenas no endpoint de refresh.
3. **`POST /auth/refresh`**  
   - **Body (JSON):** `{ "refresh_token": "<string>" }`  
   - **Sucesso 200:** `{ "access_token": "...", "refresh_token": "..." }` (rotação: invalidar refresh antigo, emitir par novo).  
   - **Falha:** 401/403 com `{ "error": "..." }`.
4. **`POST /auth/logout`** (opcional mas recomendado)  
   - Header: `Authorization: Bearer <access_token>`  
   - Body opcional: `{ "refresh_token": "<string>" }`  
   - Comportamento recomendado: invalidar refresh da sessão atual; se header+body vierem juntos, validar consistência entre ambos.
   - Resposta sugerida: `200 { "ok": true }` (idempotente).

**Login / registo / Google** devem passar a devolver, no mínimo:

```json
{
  "user": { "id": "uuid", "email": "...", "full_name": "...", "avatar_url": null },
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 900
}
```

---

### Rotas exigidas pelo app (contratos)

Todas as rotas abaixo são consumidas pelo código do repositório **inself-mobile** (ficheiros indicados para referência).

#### Saúde

| Método | Caminho | Auth | Descrição |
|--------|---------|------|-----------|
| `GET` | `/health` | Não | `{ "ok": true }` — útil para load balancer e scripts. |

---

#### Auth — público

**`POST /auth/register`**

- **Body:** `{ "email": string, "password": string, "full_name": string | null }`  
- **Sucesso 200/201:** utilizador criado + tokens (ver secção autenticação).  
- **Erro:** ex.: email duplicado `400` `{ "error": "..." }`.

**`POST /auth/login`**

- **Body:** `{ "email": string, "password": string }`  
- **Sucesso:** user + `access_token` + `refresh_token`.  
- **Erro 401:** credenciais inválidas `{ "error": "..." }`.  
- Se a conta for só Google: mensagem clara (o app trata strings específicas em alguns fluxos).

**`POST /auth/refresh`**

- **Body:** `{ "refresh_token": string }`  
- **Sucesso 200:** `{ "access_token": "...", "refresh_token": "...", "expires_in"?: number }`  
- **Erro 401/403:** `{ "error": "..." }`  
- **Regra:** single-use/rotação de refresh (token antigo inválido após uso bem-sucedido).

**`POST /auth/google`**

- **Body:** `{ "id_token": string }` — validar com Google (audience/client IDs configuráveis no servidor).  
- **Sucesso:** user + tokens como login.  
- **Erro:** 400/401 `{ "error": "..." }`.

---

#### Auth — protegido

**`GET /auth/me`**

- **Header:** `Authorization: Bearer <access_token>`  
- **Sucesso 200:**  
  `{ "user": { "id": string, "email"?: string, "full_name"?: string, "avatar_url": string | null } }`  
- **Erro 401:** token inválido/expirado.

---

#### Perfil — protegido

**`GET /profile`**

- **Sucesso 200:**  
  `{ "full_name": string | null, "display_name": string | null, "gender": string | null, "birth_date": string | null, "avatar_url": string | null }`  
  (formato data: ISO `YYYY-MM-DD` ou null.)

**`PATCH /profile`**

- **Body (parcial):**  
  `{ "full_name"?, "display_name"?, "gender"?, "birth_date"? }`  
- **Sucesso 200:** `{ "ok": true }` ou objeto perfil atualizado.

---

#### Definições do utilizador — protegido

O app sincroniza lembrete, categorias preferidas, idioma, tema e token Expo Push.

**`GET /settings`**

- **Sucesso 200 (exemplo):**  
```json
{
  "theme": "light" | "dark",
  "reminder_enabled": true,
  "reminder_time": "07:00",
  "preferred_category_slugs": ["anxiety", "stress"],
  "language": "pt" | "en",
  "expo_push_token": string | null
}
```

- **Regras:**  
  - `preferred_category_slugs`: array de slugs (strings). O app usa estes valores (máx. 3 no UI):  
    `anxiety`, `stress`, `self-love`, `discipline`, `purpose`, `relationships`, `resilience`, `mental-clarity`  
  - `reminder_time`: string `"HH:mm"` (24h), alinhada ao fuso do **servidor** ou convenção documentada (o job de push no backend histórico comparava com hora do servidor).

**`PATCH /settings`**

- **Body (parcial, qualquer combinação):**  
```json
{
  "theme": "light" | "dark",
  "reminder_enabled": boolean,
  "reminder_time": "HH:mm",
  "preferred_category_slugs": ["anxiety"],
  "language": "pt" | "en",
  "expo_push_token": string | null
}
```

- **Sucesso:** `{ "ok": true }`.  
- O servidor deve persistir `language` de forma coerente com o perfil (ex.: `locale` `pt-BR` / `en` na BD) se for esse o modelo.

---

#### Contagem de reflexões — protegido

**`GET /checkin-count`**

- **Sucesso 200:** `{ "count": number }` — número de reflexões **completas** (jornada com as três respostas), consistente com a regra de negócio do produto (o app usa para streak/badges).

---

#### Reflexões — protegido

**`GET /reflections`**

- **Sucesso 200:** array JSON (lista ordenada por data descendente). Cada elemento deve ser compatível com:

| Campo (app aceita camelCase ou snake_case onde indicado) | Tipo | Notas |
|----------------------------------------------------------|------|--------|
| `id` | string (UUID) | |
| `date` ou `completed_at` | string ISO | |
| `message`, `quote`, `author` | string | |
| `first_prompt` ou `firstPrompt` | string \| null | |
| `answers` | `{ identifique, aceite, aja }` | strings |
| `checkin_count_at_time` ou `checkinCount` | number | |
| `category` ou `category_slug` | string | slugs como em `dailyReflections` |
| `virtue` ou `virtue_slug` | string | |
| `badgeEarned` ou derivado da BD | objeto badge ou null | ver abaixo |
| `favorited` | boolean | se está nos favoritos |
| `checkoutEmotion` | `{ slug, label }` \| null | opcional; label pt no histórico |

**Paginação (recomendado):** para utilizadores com histórico extenso, implementar paginação com `?page=1&per_page=20` ou cursor-based (`?cursor=<last_id>&limit=20`). O app actual carrega tudo numa única chamada, mas a arquitectura alvo com TanStack Query (F.4) suporta `useInfiniteQuery` se a API devolver `next_cursor` ou `has_more`. Documentar o formato escolhido.

**Badge em reflexões:** o app aceita objeto com pelo menos `id` (slug), `name`, `description`, `requiredCheckins` (ou equivalente mapeado), `icon` — alinhado à lista de badges do cliente (slugs: `desperto`, `atento`, `discipulo`, `estoico`, `contemplador`, `estrategista`, `sabio`, `virtuoso`).

**`POST /reflections`**

- **Body:**  
```json
{
  "message": string,
  "quote": string,
  "author": string,
  "first_prompt": string | null,
  "answers": {
    "identifique": string,
    "aceite": string,
    "aja": string
  },
  "category_slug": string | null,
  "virtue_slug": string | null
}
```

- **Regra de negócio:** **uma reflexão completa por utilizador por dia civil** (ou a regra que o produto fixar); se já existir, devolver **201** com `id` existente + `checkinCount` + `badgeEarned` (comportamento idempotente esperado pelo fluxo do app).  
- **Sucesso 201:**  
  `{ "id": string, "checkinCount": number, "badgeEarned": <badge object> | null }`

**`POST /reflections/:id/favorite`**

- Toggle favorito.  
- **Sucesso 200:** `{ "favorited": boolean }`.

**`GET /favorites`**

- Mesmo formato de array que `GET /reflections`, filtrado aos favoritos.

---

#### Jornada emocional — protegido

**`GET /emotional-checkin/today?date=YYYY-MM-DD`**

- `date` = data no **fuso local do utilizador** (o app envia assim).  
- **Se existir check-in nesse dia:** `200` `{ "emotion_slug": string, "label": string }` (slugs iniciais: `anxious`, `stressed`, `confused`, `unmotivated`, `calm`, `confident`, `seeking-self-love`, `seeking-discipline`).  
- **Se não existir:** **`204 No Content`** sem corpo (o cliente trata como “sem dados”).

**`POST /emotional-checkin`**

- **Body:** `{ "emotion_slug": string, "date": "YYYY-MM-DD" }`  
- Um registo por utilizador por `date` (idempotente: segundo POST pode devolver 200 com flag `already_today` ou similar).  
- **Sucesso:** `201` ou `200`.

**`POST /emotional-checkout`**

- **Body:** `{ "emotion_slug": "better" | "same" | "worse" }`  
- **Sucesso:** `201`.

*(Garantir tabela `emotions` ou equivalente com tipos `initial` / `final` conforme slugs acima.)*

---

### Funcionalidades server-side recomendadas (não são chamadas diretas do `apiFetch` do app, mas o produto espera)

1. **Push notifications (Expo)**  
   - O app envia `expo_push_token` via `PATCH /settings`.  
   - O servidor deve guardar o token e, se o produto incluir lembretes diários, ter um **job** (cron/worker) que, na hora configurada por utilizador (`reminder_time`), chama a API de push da Expo (`https://exp.host/--/api/v2/push/send`) com `channelId` coerente com o app (ex.: `daily_reminder`).  
   - Documentar variáveis de ambiente (Expo project id no cliente é separado).

2. **CORS**  
   - Se no futuro houver cliente web na mesma API, configurar CORS; para só mobile nativo, menos crítico.

3. **Rate limiting** (detalhe):
   - `/auth/login`: máx. 5 tentativas por IP por minuto (protecção brute force).
   - `/auth/register`: máx. 3 por IP por minuto.
   - `/auth/refresh`: máx. 10 por utilizador por minuto (evitar loop de refresh no cliente).
   - Rotas protegidas genéricas: máx. 60 por utilizador por minuto (ajustar conforme carga).
   - Em caso de rate limit: responder `429 Too Many Requests` com `{ "error": "Rate limit exceeded", "retry_after": <seconds> }`.
   - O app deve tratar 429 e mostrar mensagem ao utilizador (integrado com `ApiError` na F.2/B.3).

---

### Modelo de dados (orientação)

Implementa migrações conforme a stack escolhida. Conceitos mínimos:

**Tabelas obrigatórias (auth customizada):**

- `users` — `id` (UUID PK), `email` (unique, not null), `password_hash` (text, nullable para OAuth-only), `full_name`, `avatar_url`, `email_verified_at`, `created_at`, `updated_at`
- `refresh_tokens` — `id` (UUID PK), `user_id` (FK users), `token_hash` (text, unique — guardar apenas hash, nunca plain text), `expires_at` (timestamptz), `revoked_at` (timestamptz, nullable), `device_info` (text, opcional), `created_at`. Índice em `(user_id, revoked_at)` para queries de sessões activas.

**Tabelas de domínio:**

- `user_profiles` (display_name, gender, birth_date, avatar_url, locale)
- `user_settings` (theme, reminder_enabled, reminder_time, preferred_category_slugs, expo_push_token, language)
- `user_reflections` (answers, quote, message, author, category, virtue, badge, completed_at, ...)
- `user_reflection_favorites`
- `emotional_checkins` / `emotional_checkouts` (ligação a `emotions`)
- `badges` (seed)
- `user_badges`, `user_streaks`, `virtue_progress`
- `challenges`, `challenge_days`, `user_challenges`, `user_challenge_days`

**Nota sobre RLS:** com auth customizada, não usar RLS do PostgreSQL (que depende de `auth.uid()` do Supabase). Em vez disso, a autorização é feita na camada da API: cada endpoint protegido extrai `user_id` do JWT e filtra queries por `WHERE user_id = $1`. Isto é mais explícito, testável, e portável entre bases de dados.  

---

### Critérios de aceite

- [ ] Todas as rotas acima implementadas com contratos descritos.  
- [ ] `POST /auth/refresh` + rotação de refresh + access JWT configurável.  
- [ ] `POST /auth/logout` (se implementado) com contrato explícito de header/body e comportamento idempotente.
- [ ] `GET /auth/me` e rotas protegidas rejeitam access inválido com 401.  
- [ ] Erros com JSON `{ "error": string }`.  
- [ ] `GET /emotional-checkin/today` retorna 204 quando vazio.  
- [ ] `POST /reflections` idempotente por dia conforme regra acordada.  
- [ ] Migrações + seed de emoções/categorias/badges compatíveis com os slugs usados no app.  
- [ ] README com variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, segredos Google se aplicável, etc.).
- [ ] Documento de contrato/versionamento com exemplos reais de `login`, `refresh` e `logout` (request/response).
- [ ] Paginação em `GET /reflections` documentada (cursor ou offset) e testada com >50 reflexões.
- [ ] Rate limiting em `/auth/*` com resposta 429 e campo `retry_after`.
- [ ] Tabela `users` com `password_hash` (bcrypt cost >= 12 ou argon2id); sem dependência de `auth.users` do Supabase.
- [ ] Tabela `refresh_tokens` com `token_hash` (nunca plain text); rotação funcional; cleanup de expirados.
- [ ] Autorização por `user_id` extraído do JWT em todos os endpoints protegidos (sem RLS).

---

### Stack e repositório *(completar pelo humano)*

- Linguagem / framework: **___**  
- Base de dados: **___**  
- Estilo de projeto (monólito, módulos): **___**  
- Hospedagem alvo: **___**

## ---PROMPT--- (fim)

---

## Referência rápida — ficheiros no mobile

| Área | Ficheiros |
|------|-----------|
| Cliente HTTP | `lib/api.ts` |
| Auth | `contexts/AuthContext.tsx` |
| Settings / push token | `contexts/SettingsContext.tsx`, `contexts/ThemeContext.tsx` |
| Reflexões | `lib/reflectionHistory.ts` |
| Check-in/out | `lib/emotionalJourney.ts` |
| Contagem | `lib/badges.ts` |
| Perfil | `app/(tabs)/settings/account-details.tsx` |

*Última revisão: derivado do código do app; alinhar com `docs/ARQUITETURA_CORPORATIVA.md` para refresh token no cliente.*
