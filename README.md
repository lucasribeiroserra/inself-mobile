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

**API e banco:** o backend e as migrations SQL ficam em **outro repositório/projeto** (não fazem parte deste repo). Suba a API por lá e aponte `EXPO_PUBLIC_API_URL` para a URL base (ex.: `http://localhost:3000`).

## Como rodar

### Testar cadastro e login (app + API)

1. No **projeto da API**: suba o PostgreSQL, rode as migrations e inicie o servidor (siga o README do repositório do backend).

2. **Terminal – app:**
   ```bash
   npm run start
   ```
   (`npm run dev` equivale ao mesmo: só o Expo na porta 8082.)

3. Na raiz do app, configure **`.env`** com `EXPO_PUBLIC_API_URL` apontando para a API (ex.: `http://localhost:3000`; em dispositivo físico use o IP da máquina).

4. No app: "Cadastre-se" / "Entrar" conforme o fluxo normal.

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

## Banco de dados e API

O app em si **não** inclui migrations nem servidor: isso fica no repositório do **backend**. Lá você cria o banco PostgreSQL, executa os SQLs de migration e sobe a API REST.

### Configurar o app

Na raiz do projeto mobile:

```bash
cp .env.example .env
# Edite .env: EXPO_PUBLIC_API_URL=http://localhost:3000
# Em dispositivo físico use o IP da máquina, ex.: http://192.168.1.10:3000
npx expo start -c
```

Sem `EXPO_PUBLIC_API_URL` configurado, o app roda em modo **demo** (Auth mock, AsyncStorage).

### Ver os dados no pgAdmin

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
