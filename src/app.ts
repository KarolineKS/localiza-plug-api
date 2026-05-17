import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import stationsRouter from './routes/stations';
import adminRouter from './routes/admin';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'LocalizaPlug API',
    version: '1.0.0',
    description: 'API REST de eletropostos. Cada estação tem múltiplos plugs com status próprio.',
    auth: {
      scheme: 'Bearer JWT',
      howTo: 'POST /api/admin/login com { password } retorna { token }. Use Authorization: Bearer <token> nas rotas protegidas.',
    },
    endpoints: {
      public: {
        'GET /api/stations': {
          description: 'Lista estações com plugs. Filtros combináveis em AND.',
          query: {
            status: 'Disponível | Ocupado | Em Manutenção | Reservado (estações com pelo menos 1 plug nesse status)',
            connector: 'CCS2 | Tipo 2 | CHAdeMO',
            minPower: 'powerKW >= valor (number)',
            priceType: 'Gratuito | Pago',
            city: 'busca parcial case-insensitive',
          },
          exampleResponse: {
            data: [
              {
                id: 'cmp...',
                name: 'WEG Shopping Pelotas',
                lat: -31.7716,
                lng: -52.3325,
                address: 'R. Sen. Joaquim Assumpção, 100',
                neighborhood: 'Areal',
                city: 'Pelotas',
                state: 'RS',
                plugs: [
                  {
                    id: 'cmp...',
                    connectorType: 'CCS2',
                    powerKW: 60,
                    status: 'Disponível',
                    pricePerKWh: 1.45,
                    priceType: 'Pago',
                    reservedUntil: null,
                  },
                ],
                createdAt: '2026-05-17T00:00:00.000Z',
                updatedAt: '2026-05-17T00:00:00.000Z',
              },
            ],
            meta: { total: 8, timestamp: '2026-05-17T00:00:00.000Z', source: 'LocalizaPlug API v1' },
          },
        },
        'GET /api/stations/:id': {
          description: 'Detalhe de uma estação. Retorna 404 se não existe.',
        },
      },
      admin: {
        'POST /api/admin/login': {
          auth: 'public',
          body: { password: 'string' },
          success: { token: 'JWT (HS256, expira em JWT_EXPIRES_IN)' },
          errors: { 401: { code: 'INVALID_PASSWORD' } },
        },
        'POST /api/admin/stations': {
          auth: 'Bearer required',
          body: {
            name: 'string',
            lat: 'number',
            lng: 'number',
            address: 'string',
            neighborhood: 'string',
            city: 'string (opcional, default Pelotas)',
            state: 'string (opcional, default RS)',
            plugs: '[{ connectorType, powerKW, status, pricePerKWh, priceType }]',
          },
          success: { status: 201, returns: '{ data: station }' },
        },
        'PUT /api/admin/stations/:id': {
          auth: 'Bearer required',
          body: 'Mesmos campos do POST, todos opcionais. Se enviar "plugs", faz replace (apaga os antigos, cria os novos).',
          success: { status: 200, returns: '{ data: station }' },
          errors: { 404: { code: 'STATION_NOT_FOUND' } },
        },
        'DELETE /api/admin/stations/:id': {
          auth: 'Bearer required',
          success: { status: 200, returns: '{ data: { deleted: true, id } }' },
          note: 'Plugs são removidos em cascade.',
        },
        'POST /api/admin/plugs/:plugId/reserve': {
          auth: 'Bearer required',
          body: { durationSeconds: 'number opcional (default 900 = 15min)' },
          effect: 'Marca plug como Reservado e define reservedUntil = now + durationSeconds.',
          success: { status: 200, returns: '{ data: plug }' },
          errors: { 404: { code: 'PLUG_NOT_FOUND' } },
        },
      },
    },
    errorFormat: { error: { code: 'STRING_CODE', message: 'descrição em português' } },
  });
});

app.use('/api/stations', stationsRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Rota ${req.method} ${req.originalUrl} não encontrada.` },
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Erro interno do servidor.' },
  });
});

export default app;
