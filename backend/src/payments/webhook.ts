import { Router, type Request, type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { verifyWebhookSignature } from '../lib/midtrans/midtrans-client.js';
import * as orderRepo from '../orders/repository.js';
import * as enrollmentRepo from '../enrollments/repository.js';
import type { MidtransWebhookPayload } from '../lib/midtrans/midtrans-types.js';

export const webhookRouter = Router();

// POST /api/payments/webhook
// Tidak dilindungi requireAuth — Midtrans call dari server mereka.
// WAJIB verifikasi signature sebelum memproses apapun.
webhookRouter.post('/webhook', async (req: Request, res: Response) => {
  const payload = req.body as MidtransWebhookPayload;

  // Verifikasi signature Midtrans — reject langsung jika gagal
  if (!verifyWebhookSignature(payload)) {
    console.warn('[Webhook] Signature tidak valid, order_id:', payload.order_id);
    return void res.status(400).json({ error: 'invalid signature' });
  }

  const { order_id: midtransOrderId, transaction_status, gross_amount } = payload;

  try {
    const order = await orderRepo.findByMidtransOrderId(midtransOrderId);
    if (!order) {
      console.warn('[Webhook] Order tidak ditemukan:', midtransOrderId);
      return void res.status(200).json({ received: true }); // 200 agar Midtrans tidak retry
    }

    // ── Settlement / Capture → pembayaran berhasil ────────────
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (order.status !== 'pending') {
        // Sudah diproses sebelumnya (idempotent)
        return void res.status(200).json({ received: true });
      }

      const now            = new Date();
      const paymentDate    = now.toISOString();
      const refundWindowMs = 48 * 60 * 60 * 1000;
      const expiredAt      = new Date(now.getTime() + refundWindowMs).toISOString();

      await orderRepo.updateStatus(order.id, {
        status:       'paid',
        payment_date: paymentDate,
        expired_at:   expiredAt,
      });

      // Cek is_first_enrollment — count SEBELUM insert enrollment baru
      const prevCount = await enrollmentRepo.countAllBySiswa(order.siswa_id);
      const isFirst   = prevCount === 0;

      // Hitung expires_at dari program.durasi_hari
      const { data: program } = await supabase
        .from('programs')
        .select('durasi_hari')
        .eq('id', order.program_id)
        .single();

      let expiresAt: string | null = null;
      if (program?.durasi_hari) {
        const msPerDay = 24 * 60 * 60 * 1000;
        expiresAt = new Date(now.getTime() + program.durasi_hari * msPerDay).toISOString();
      }

      await enrollmentRepo.create({
        siswa_id:            order.siswa_id,
        program_id:          order.program_id,
        order_id:            order.id,
        expires_at:          expiresAt,
        is_first_enrollment: isFirst,
      });

      console.log(`[Webhook] Paid → order ${order.id}, is_first=${isFirst}, expires=${expiresAt ?? 'never'}`);
    }

    // ── Expire / Cancel → order kedaluwarsa tanpa dibayar ─────
    else if (transaction_status === 'expire') {
      if (order.status === 'pending') {
        await orderRepo.updateStatus(order.id, { status: 'expired' });
        console.log(`[Webhook] Expired → order ${order.id}`);
      }
    } else if (transaction_status === 'cancel') {
      if (order.status === 'pending') {
        await orderRepo.updateStatus(order.id, { status: 'cancelled' });
        console.log(`[Webhook] Cancelled → order ${order.id}`);
      }
    }

    // ── Refund dari Midtrans dashboard (opsional) ─────────────
    else if (transaction_status === 'refund') {
      if (order.status === 'paid') {
        await orderRepo.updateStatus(order.id, { status: 'refunded' });
        await enrollmentRepo.updateStatusByOrderId(order.id, 'refunded');
        console.log(`[Webhook] Refunded (via Midtrans) → order ${order.id}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error:', (err as Error).message, '| order_id:', midtransOrderId);
    // Kembalikan 200 agar Midtrans tidak retry webhook yang sudah partially processed
    res.status(200).json({ received: true, note: 'processed with errors' });
  }
});
