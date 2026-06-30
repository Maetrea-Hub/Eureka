import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS: izinkan hanya dari frontend URL yang dikonfigurasi ──
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json());

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ── Routes ───────────────────────────────────────────────────
import { authRouter }      from './auth/controller';
import { programsRouter }  from './programs/controller';
import { materialsRouter } from './materials/controller';

app.use('/api/auth',      authRouter);
app.use('/api/programs',  programsRouter);
app.use('/api/materials', materialsRouter);

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

export default app;
