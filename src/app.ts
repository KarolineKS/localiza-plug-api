import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import stationsRouter from './routes/stations';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
  }),
);

app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'LocalizaPlug API',
    version: '1.0.0',
    endpoints: ['GET /api/stations', 'GET /api/stations/:id'],
  });
});

app.use('/api/stations', stationsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Rota ${req.method} ${req.originalUrl} não encontrada.` },
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Erro interno do servidor.',
    },
  });
});

export default app;
