import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as service from './service.js';

export const financeRouter = Router();

// GET /api/finance/summary
financeRouter.get(
  '/summary',
  requireAuth,
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      res.json(await service.getSummary());
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat summary' });
    }
  },
);

// GET /api/finance/by-month?year=2026
financeRouter.get(
  '/by-month',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const year = parseInt((req.query['year'] as string | undefined) ?? String(new Date().getFullYear()), 10);
      res.json(await service.getByMonth(year));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat data bulanan' });
    }
  },
);

// GET /api/finance/by-program
financeRouter.get(
  '/by-program',
  requireAuth,
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      res.json(await service.getByProgram());
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat data program' });
    }
  },
);

// GET /api/finance/export-csv?from=&to=
financeRouter.get(
  '/export-csv',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query as Record<string, string | undefined>;
      const rows = await service.getForExport(from || undefined, to || undefined);

      const header = 'Order ID,Nama Siswa,Email,Program,Nominal,Tanggal Bayar\n';
      const body   = rows.map(r =>
        [
          r.order_id,
          `"${r.siswa_nama.replace(/"/g, '""')}"`,
          r.siswa_email,
          `"${r.program_nama.replace(/"/g, '""')}"`,
          r.nominal,
          r.paid_at ? new Date(r.paid_at).toLocaleDateString('id-ID') : '',
        ].join(','),
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="laporan-keuangan.csv"');
      // BOM agar Excel bisa baca UTF-8 dengan benar
      res.send('﻿' + header + body);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal export CSV' });
    }
  },
);
