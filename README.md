# LocalizaPlug API

API REST do **LocalizaPlug** — web app de localização de eletropostos para carros elétricos em Pelotas/RS.

Cada **estação** tem múltiplos **plugs**, e cada plug tem seu próprio status, tipo de conector, potência e preço.

## Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- Neon (PostgreSQL serverless)
- Deploy na Vercel como Serverless Function
- Auth: senha de admin (bcrypt) + JWT (HS256)

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

O hook `postinstall` roda `prisma generate` automaticamente.

### 2. Criar banco no Neon

1. Crie uma conta em [neon.tech](https://neon.tech).
2. Crie um projeto (region: AWS US East ou SA East).
3. No dashboard, abra **Connection Details** e copie:
   - Connection string **com pooler** (contém `-pooler.neon.tech`) → `DATABASE_URL`
   - Connection string **direta** (sem `-pooler`) → `DIRECT_URL`

### 3. Gerar senha de admin

```bash
node -e "console.log(require('bcryptjs').hashSync('minhasenha', 10))"
```

Copia o hash retornado (algo como `$2a$10$...`) — esse é o valor de `ADMIN_PASSWORD`. A senha em texto plano **nunca** é guardada em lugar nenhum, só o hash bcrypt fica na env var.

### 4. Gerar JWT_SECRET

```bash
openssl rand -base64 32
```

### 5. Preencher .env

```bash
cp .env.example .env
```

Edite os 4 valores: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD` (hash bcrypt), `JWT_SECRET`. Opcionalmente ajuste `JWT_EXPIRES_IN` (default `24h`).

### 6. Migration + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 7. Subir servidor

```bash
npm run dev
```

> `npm run dev` usa `vercel dev` (precisa do `vercel login`). Para rodar standalone sem o CLI da Vercel: `npx tsx scripts/dev.ts` (porta 3000 ou `PORT=…`).

---

## Deploy na Vercel

```bash
vercel login
vercel link
```

No dashboard da Vercel → **Settings → Environment Variables**, adicione **as 4 variáveis**:
- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD` (hash bcrypt)
- `JWT_SECRET`

Aplique a migration no Neon de produção:

```bash
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
DATABASE_URL=... DIRECT_URL=... npm run db:seed
```

Deploy:

```bash
vercel --prod
```

O hook `vercel-build` roda `prisma generate && tsc`.

---

## Endpoints públicos

### `GET /api/stations`

Lista estações com plugs incluídos.

**Query params** (todos opcionais, combináveis em AND):

| Param        | Exemplo          | Descrição                                                  |
|--------------|------------------|------------------------------------------------------------|
| `status`     | `Disponível`     | Estações com pelo menos 1 plug nesse status                |
| `connector`  | `CCS2`           | Estações com pelo menos 1 plug desse conector              |
| `minPower`   | `50`             | Estações com pelo menos 1 plug com `powerKW >= valor`      |
| `priceType`  | `Gratuito`       | Estações com pelo menos 1 plug desse tipo de preço         |
| `city`       | `pelo`           | Busca parcial case-insensitive em `city`                   |

**Resposta:**

```json
{
  "data": [
    {
      "id": "cm...",
      "name": "WEG Shopping Pelotas",
      "lat": -31.7716,
      "lng": -52.3325,
      "address": "R. Sen. Joaquim Assumpção, 100",
      "neighborhood": "Areal",
      "city": "Pelotas",
      "state": "RS",
      "plugs": [
        {
          "id": "cm...",
          "connectorType": "CCS2",
          "powerKW": 60,
          "status": "Disponível",
          "pricePerKWh": 1.45,
          "priceType": "Pago",
          "reservedUntil": null
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "total": 8, "timestamp": "...", "source": "LocalizaPlug API v1" }
}
```

### `GET /api/stations/:id`

Detalhe de uma estação com seus plugs.

---

## Endpoints administrativos

### `POST /api/admin/login`

Body:

```json
{ "password": "minhasenha" }
```

Compara com `process.env.ADMIN_PASSWORD` (hash bcrypt). Em sucesso retorna `{ "token": "..." }` (JWT HS256 com `{ "role": "admin" }`, expira em `JWT_EXPIRES_IN`).

Erro 401:

```json
{ "error": { "code": "INVALID_PASSWORD", "message": "Senha incorreta" } }
```

### Rotas protegidas

Todas exigem `Authorization: Bearer <token>`.

| Método | Rota                                | Status  |
|--------|-------------------------------------|---------|
| POST   | `/api/admin/stations`               | 201     |
| PUT    | `/api/admin/stations/:id`           | 200     |
| DELETE | `/api/admin/stations/:id`           | 200     |
| POST   | `/api/admin/plugs/:plugId/reserve`  | 200     |

**Criar estação:**

```json
POST /api/admin/stations
{
  "name": "Posto Teste",
  "lat": -31.77, "lng": -52.33,
  "address": "Rua X, 1",
  "neighborhood": "Centro",
  "plugs": [
    { "connectorType": "CCS2", "powerKW": 50, "status": "Disponível", "pricePerKWh": 1.5, "priceType": "Pago" }
  ]
}
```

**Atualizar:** `PUT` aceita os mesmos campos do POST, todos opcionais. Se enviar `plugs`, faz **replace** (apaga os antigos, cria os novos) — estratégia simples em vez de diff.

**Reservar plug:**

```json
POST /api/admin/plugs/:plugId/reserve
{ "durationSeconds": 15 }
```

Body opcional. Default = `900` (15 minutos). Aceita valores pequenos como `15` pra demo.

---

## Consumindo do Lovable

```ts
const API = "https://SEU-PROJETO.vercel.app";

// login
const r = await fetch(`${API}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: "..." }),
});
const { token } = await r.json();
localStorage.setItem("token", token);

// chamada autenticada
await fetch(`${API}/api/admin/stations`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

CORS está liberado pra `*` com `GET, POST, PUT, DELETE, OPTIONS` e headers `Content-Type, Authorization`.

---

## Segurança

- A senha de admin **nunca** é guardada em texto plano. Apenas o hash bcrypt vai pra `ADMIN_PASSWORD`.
- O JWT é assinado com `JWT_SECRET` (HS256). Trate como segredo — não comite, não logue, não exponha no frontend.
- Como há **uma única conta admin**, qualquer cliente com a senha tem acesso total. Para múltiplos operadores reais, evolua pra tabela `User` com roles.

---

## Estrutura

```
localizaplug-api/
├── api/index.ts                # entry da Vercel
├── scripts/dev.ts              # dev local sem vercel cli
├── src/
│   ├── app.ts
│   ├── routes/
│   │   ├── stations.ts
│   │   └── admin.ts
│   ├── controllers/
│   │   ├── stationsController.ts
│   │   └── adminController.ts
│   ├── middlewares/
│   │   └── authMiddleware.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── auth.ts
│   └── types/index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── bruno/                      # coleção de requests Bruno
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.example
```
