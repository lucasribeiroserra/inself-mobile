# InSelf API

API REST em Node/Express que persiste dados no PostgreSQL. O app mobile chama esta API quando `EXPO_PUBLIC_API_URL` está configurado.

## Setup

```bash
cd backend
cp .env.example .env
# Edite .env: DATABASE_URL (ex.: postgresql://usuario:senha@localhost:5432/inself) e JWT_SECRET
npm install
```

Antes de subir a API, execute o SQL em `../database/migrations/001_standalone_postgres.sql` no seu PostgreSQL (pgAdmin ou psql).

## Rodar

```bash
npm run dev
```

Porta padrão: 3000. Acesse `http://localhost:3000/health` para testar.

## Endpoints

- `POST /auth/register` — cadastro (email, password, full_name opcional)
- `POST /auth/login` — login (email, password) → retorna `{ user, token }`
- `GET /auth/me` — usuário atual (header `Authorization: Bearer <token>`)
- `GET /settings` — tema, lembrete, categorias preferidas
- `PATCH /settings` — atualizar tema, reminder_enabled, reminder_time
- `GET /checkin-count` — quantidade de reflexões concluídas
- `GET /reflections` — histórico de reflexões
- `POST /reflections` — salvar nova reflexão (uma por dia por usuário)
- `POST /reflections/:id/favorite` — toggle favorito
- `GET /favorites` — lista de favoritos
- `POST /emotional-checkin` — body `{ emotion_slug }` (ex.: anxious, calm)
- `POST /emotional-checkout` — body `{ emotion_slug }` (ex.: better, same, worse)

Todos os endpoints (exceto auth e health) exigem `Authorization: Bearer <token>`.
