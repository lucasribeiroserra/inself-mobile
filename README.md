# InSelf Mobile

App de saúde mental **InSelf** para Android e iOS, com interface fiel ao design system Inself.

## Stack

- **Expo** (SDK 52) + **Expo Router** (file-based)
- **React Native** + **TypeScript**
- **NativeWind** (Tailwind CSS para RN)
- **Lucide React Native** (ícones)
- **AsyncStorage** (persistência local)
- **date-fns** (datas em pt-BR)

## Estrutura

- `app/` — rotas (Expo Router)
  - `index.tsx` — redireciona para auth ou (tabs)
  - `auth.tsx` — login + cadastro + perfil opcional
  - `(tabs)/` — abas: Início, Desafios, Virtudes, Histórico, Perfil
  - `challenges/[id].tsx` — tela de progresso do desafio
- `components/` — TopHeader, EmotionalCheckIn, EmotionalCheckOut, CheckInCelebration
- `contexts/` — AuthContext (estado do usuário e contagem de check-ins)
- `lib/` — api (cliente da API), virtues, challenges, dailyReflections, badges, reflectionHistory (API ou AsyncStorage)
- `backend/` — API Node/Express com PostgreSQL (auth JWT, reflexões, favoritos, check-in/check-out emocional, settings)
- `database/migrations/` — SQL para PostgreSQL (rodar no pgAdmin)

## Como rodar

### Testar cadastro e login (app + backend integrados)

1. **Banco:** tenha o PostgreSQL com o banco `inself` criado e as migrations rodadas (veja "Banco de dados" abaixo). Usuário `inself` / senha `inself` no banco.

2. **Um terminal – backend:**
   ```bash
   cd backend && npm run dev
   ```
   Deve aparecer: `InSelf API rodando em http://localhost:3000`

3. **Outro terminal – app:**
   ```bash
   npm run start
   ```
   Ou, para subir backend e app no mesmo comando: `npm run dev` (backend na porta 3000, Expo na 8082).

4. O arquivo **`.env`** na raiz já está com `EXPO_PUBLIC_API_URL=http://localhost:3000`. O **`backend/.env`** está com `DATABASE_URL=postgresql://inself:inself@localhost:5432/inself`. Assim o app usa a API e o cadastro/login gravam no banco.

5. No app: toque em "Cadastre-se", preencha **Nome**, **Email** e **Senha**, depois "Criar conta". Você deve ser levado para a home. Para entrar de novo: "Entrar" com o mesmo email e senha.

---

1. Instale dependências:
   ```bash
   cd inself-mobile && npm install
   ```

2. Gere os assets (ou use placeholders):
   - Crie `assets/icon.png`, `assets/splash-icon.png`, `assets/adaptive-icon.png`, `assets/favicon.png`
   - Ou use os padrões do Expo removendo/ajustando referências em `app.json`

3. Inicie o projeto:
   ```bash
   npx expo start
   ```
   - Pressione `i` para iOS ou `a` para Android (com emulador ou dispositivo).
   - Para web: `npx expo start --web`

## Banco de dados (PostgreSQL + pgAdmin)

O app persiste **check-in emocional**, **reflexões**, **favoritos**, **badges**, **tema** e **preferências** em **PostgreSQL**. Você acessa os dados pelo **pgAdmin** (ou qualquer cliente SQL).

### 1. Criar o banco no PostgreSQL

1. Instale o PostgreSQL (local ou servidor) e abra o **pgAdmin**.
2. Crie um banco (ex.: `inself`).
3. Conecte nesse banco e abra o **Query Tool**.
4. Execute todo o conteúdo do arquivo **`database/migrations/001_standalone_postgres.sql`** (tabelas `users`, conteúdo, jornada, gamificação + seed de emoções, categorias, virtudes, reflexões, badges).

### 2. Subir a API (backend Node)

O app fala com uma API REST que usa o mesmo PostgreSQL.

```bash
cd backend
cp .env.example .env
# Edite .env: DATABASE_URL=postgresql://usuario:senha@localhost:5432/inself e JWT_SECRET
npm install
npm run dev
```

A API roda em `http://localhost:3000` (ou a porta que você definir em `PORT`).

### 3. Configurar o app

Na raiz do projeto mobile:

```bash
cp .env.example .env
# Edite .env: EXPO_PUBLIC_API_URL=http://localhost:3000
# Em dispositivo físico use o IP da máquina, ex.: http://192.168.1.10:3000
npx expo start -c
```

Sem `EXPO_PUBLIC_API_URL` configurado, o app roda em modo **demo** (Auth mock, AsyncStorage).

### 4. Ver os dados no pgAdmin

No pgAdmin, use o **Query Tool** nas tabelas `public.users`, `public.user_reflections`, `public.emotional_checkins`, `public.emotional_checkouts`, etc. Todas as operações são por `user_id`.

## Autenticação

Com a API configurada, o app usa **login/cadastro** na API (JWT). Sem API, um mock define o usuário localmente.

## Repositório

Projeto independente; para integrar ao backend: Para usar com o repositório GitHub existente:

```bash
# Se o repositório inself-mobile já existir em outro diretório:
cd /caminho/para/inself-mobile
git remote add origin https://github.com/lucasribeiroserra/inself-mobile.git

# Ou clone e copie o conteúdo desta pasta para lá
git clone https://github.com/lucasribeiroserra/inself-mobile.git
cp -R inself-mobile/* inself-mobile/.git ignorando se necessário
```

## Próximos passos

- Configurar **Expo Notifications** (FCM/APNs) para lembretes.
- Adicionar **Expo SecureStore** para tokens sensíveis.
