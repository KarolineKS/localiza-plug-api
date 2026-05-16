# LocalizaPlug API

API REST do **LocalizaPlug** — web app de localização de eletropostos para carros elétricos em Pelotas/RS.

Stack: **Node.js + TypeScript + Express + Prisma + Neon (PostgreSQL serverless) + Vercel**.

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

O hook `postinstall` já roda `prisma generate` automaticamente.

### 2. Criar banco no Neon

1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um novo projeto (region: AWS US East ou SA East)
3. No dashboard do projeto, vá em **Connection Details** e copie:
   - A **connection string com pooler** (URL contém `-pooler.neon.tech`)
   - A **connection string direta** (URL contém `.neon.tech` SEM `-pooler`)

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```env
DATABASE_URL="postgresql://...-pooler.neon.tech/..."
DIRECT_URL="postgresql://....neon.tech/..."
```

> **Por que duas URLs?** O Prisma usa `DIRECT_URL` para migrations (precisa de conexão direta, sem pooler) e `DATABASE_URL` em runtime (com pooler, ideal para serverless).

### 4. Rodar migrations

```bash
npx prisma migrate dev --name init
```

### 5. Popular banco com eletropostos de Pelotas

```bash
npm run db:seed
```

### 6. Subir servidor de dev

```bash
npm run dev
```

Servidor roda em `http://localhost:3000` via `vercel dev`.

---

## Deploy na Vercel

```bash
# 1. Login
vercel login

# 2. Linkar projeto
vercel link

# 3. Configurar env vars no dashboard da Vercel
# Settings → Environment Variables:
#   DATABASE_URL = postgresql://...-pooler.neon.tech/...
#   DIRECT_URL   = postgresql://....neon.tech/...

# 4. Deploy de produção
vercel --prod
```

O hook `vercel-build` (`prisma generate && tsc`) roda automaticamente no build da Vercel.

---

## Endpoints

### `GET /api/stations`

Lista eletropostos com filtros opcionais.

**Query params** (todos opcionais, combináveis em AND):

| Param       | Tipo   | Exemplo               | Descrição                              |
|-------------|--------|-----------------------|----------------------------------------|
| `status`    | string | `Disponível`          | Status do eletroposto                  |
| `connector` | string | `CCS2`                | Tipo de conector                       |
| `minPower`  | number | `50`                  | Potência mínima em kW (`powerKW >= N`) |
| `city`      | string | `Pelotas`             | Cidade                                 |

**Exemplos:**

```bash
GET /api/stations
GET /api/stations?status=Disponível
GET /api/stations?connector=CCS2&minPower=50
GET /api/stations?city=Pelotas&status=Disponível
```

**Resposta:**

```json
{
  "data": [
    {
      "id": "pel_001",
      "name": "WEG Shopping Pelotas",
      "lat": -31.7716,
      "lng": -52.3325,
      "address": "R. Sen. Joaquim Assumpção, 100",
      "neighborhood": "Areal",
      "city": "Pelotas",
      "state": "RS",
      "status": "Disponível",
      "connector": "CCS2",
      "powerKW": 60,
      "price": "Pago",
      "createdAt": "2026-05-16T12:00:00.000Z",
      "updatedAt": "2026-05-16T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "timestamp": "2026-05-16T12:00:00.000Z",
    "source": "LocalizaPlug API v1"
  }
}
```

### Autenticação — `POST /api/auth/register` e `POST /api/auth/login`

Body:

```json
{ "email": "admin@test.com", "password": "senha123" }
```

Resposta (`201` register, `200` login):

```json
{
  "data": {
    "user": { "id": "...", "email": "admin@test.com", "createdAt": "..." },
    "token": "eyJhbGciOi..."
  }
}
```

> Por enquanto **todo usuário cadastrado é admin** (sem campo de role). Para o MVP, o `/register` é aberto — quando for pra produção, adicione um token de convite ou desabilite o endpoint.

### `GET /api/auth/me`

Header `Authorization: Bearer <token>`. Retorna o usuário corrente.

### Admin — CRUD de eletropostos

Todas as rotas exigem `Authorization: Bearer <token>`.

| Método  | Rota                          | Status sucesso |
|---------|-------------------------------|----------------|
| POST    | `/api/admin/stations`         | `201`          |
| PATCH   | `/api/admin/stations/:id`     | `200`          |
| DELETE  | `/api/admin/stations/:id`     | `204`          |

`POST` aceita o body completo (status/connector/price com labels: `"Disponível"`, `"CCS2"`, `"Pago"`, etc.). `PATCH` é parcial — envie só os campos a alterar.

### Consumindo do Lovable

```ts
const API = "https://SEU-PROJETO.vercel.app";
const token = localStorage.getItem("token");

const r = await fetch(`${API}/api/admin/stations`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

CORS já está liberado pra `*` com `GET, POST, PATCH, DELETE, OPTIONS` e headers `Content-Type, Authorization`.

### `GET /api/stations/:id`

Retorna detalhe de um eletroposto.

```bash
GET /api/stations/pel_001
```

Resposta `404`:

```json
{ "error": { "code": "STATION_NOT_FOUND", "message": "Eletroposto pel_999 não encontrado." } }
```

---

## Scripts

| Script              | Descrição                                          |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Servidor local com `vercel dev`                    |
| `npm run build`     | `prisma generate && tsc`                           |
| `npm run db:migrate`| Roda `prisma migrate dev`                          |
| `npm run db:seed`   | Popula banco com 8 eletropostos de Pelotas         |

---

## Estrutura

```
localizaplug-api/
├── api/index.ts              # entry da Vercel (export default app)
├── src/
│   ├── app.ts                # Express + middlewares + rotas
│   ├── routes/stations.ts
│   ├── controllers/stationsController.ts
│   ├── lib/prisma.ts         # singleton com globalThis
│   └── types/index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.example
```
