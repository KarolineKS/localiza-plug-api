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
    endpoints: [
      'GET /api/stations',
      'GET /api/stations/:id',
      'POST /api/admin/login',
      'POST /api/admin/stations',
      'PUT /api/admin/stations/:id',
      'DELETE /api/admin/stations/:id',
      'POST /api/admin/plugs/:plugId/reserve',
    ],
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
