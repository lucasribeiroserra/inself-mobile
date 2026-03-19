# Migrations – InSelf

As migrations criam/atualizam o schema do PostgreSQL usado pelo backend.

## Tornar o usuário `inself` dono do banco

Se você criou o banco com outro usuário (ex. seu usuário do Mac) e quer que **inself** seja o dono (para rodar `npm run migrate` sem erro de permissão):

1. No **pgAdmin**, conecte ao servidor como **superusuário** (quem criou o PostgreSQL ou o usuário padrão).
2. Selecione o banco **inself** e abra o **Query Tool**.
3. Abra o arquivo **`migrations/000_make_inself_owner.sql`**, cole o conteúdo no editor e execute (F5).

Isso vai: criar o role `inself` com senha `inself` (se não existir), tornar `inself` dono do banco e de todas as tabelas/sequences do `public`, e dar as permissões necessárias. Depois você pode rodar as migrations com:

```bash
cd backend
DATABASE_URL="postgresql://inself:inself@localhost:5432/inself" npm run migrate
```

## Rodar migrations

É preciso usar o **usuário dono do banco** (quem criou o banco no PostgreSQL). No macOS com Homebrew costuma ser seu usuário do sistema, sem senha.

```bash
cd backend
# Troque USUARIO por quem é dono do banco (ex.: seu usuário macOS)
DATABASE_URL="postgresql://USUARIO@localhost:5432/inself" npm run migrate
```

Ou com senha:

```bash
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/inself" npm run migrate
```

**Se der erro de permissão (42501):** rode o SQL manualmente no pgAdmin, conectado como dono do banco:

1. Abra `database/migrations/002_google_auth_and_avatar.sql`
2. Execute no banco `inself`

Depois disso, o app está pronto para login (email/senha e Google) e primeiro cadastro.
