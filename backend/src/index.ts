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
import { authRouter }          from './auth/controller';
import { programsRouter }      from './programs/controller';
import { materialsRouter }     from './materials/controller';
import { schedulesRouter }     from './schedules/controller';
import { ordersRouter }        from './orders/controller';
import { enrollmentsRouter }   from './enrollments/controller';
import { refundsRouter }       from './refunds/controller';
import { webhookRouter }       from './payments/webhook';
import { notificationsRouter } from './notifications/controller';
import { zoomWebhookRouter }   from './zoom/webhook';
import { financeRouter }       from './finance/controller';
import { auditRouter }         from './audit/controller';
import { crmRouter }           from './crm/controller';

app.use('/api/auth',          authRouter);
app.use('/api/programs',      programsRouter);
app.use('/api/materials',     materialsRouter);
app.use('/api/schedules',     schedulesRouter);
app.use('/api/orders',        ordersRouter);
app.use('/api/enrollments',   enrollmentsRouter);
app.use('/api/refunds',       refundsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/finance',       financeRouter);
app.use('/api/audit',         auditRouter);
app.use('/api/crm',           crmRouter);
// Webhook tanpa global auth — verifikasi signature dilakukan di dalam handler masing-masing
app.use('/api/payments',      webhookRouter);
app.use('/api/zoom',          zoomWebhookRouter);

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

import { startNotificationScheduler } from './lib/scheduler/notification-scheduler';

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  startNotificationScheduler();
});

export default app;
