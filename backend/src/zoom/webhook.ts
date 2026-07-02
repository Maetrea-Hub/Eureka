import { Router, type Request, type Response } from 'express';
import { createHmac } from 'crypto';
import { supabase } from '../lib/supabase.js';
import * as notifService from '../notifications/service.js';
import type { NotifRecipient } from '../notifications/types.js';

export const zoomWebhookRouter = Router();

const SECRET_TOKEN = process.env.ZOOM_WEBHOOK_SECRET_TOKEN ?? '';

function verifyZoomSignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!SECRET_TOKEN) return false;
  const message  = `v0:${timestamp}:${rawBody}`;
  const expected = 'v0=' + createHmac('sha256', SECRET_TOKEN).update(message).digest('hex');
  return expected === signature;
}

// POST /api/zoom/webhook
// Tidak dilindungi requireAuth — Zoom call dari server mereka.
// Verifikasi via HMAC-SHA256 dari ZOOM_WEBHOOK_SECRET_TOKEN.
zoomWebhookRouter.post('/webhook', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  // ── URL validation challenge (saat pertama register endpoint di Zoom) ──
  if (body.event === 'endpoint.url_validation') {
    const plainToken = (body.payload as Record<string, string>)?.plainToken ?? '';
    if (!SECRET_TOKEN) return void res.status(500).json({ error: 'ZOOM_WEBHOOK_SECRET_TOKEN belum dikonfigurasi' });
    const encryptedToken = createHmac('sha256', SECRET_TOKEN).update(plainToken).digest('hex');
    return void res.json({ plainToken, encryptedToken });
  }

  // ── Signature verification untuk semua event lainnya ──────────
  const timestamp  = req.headers['x-zm-request-timestamp'] as string ?? '';
  const signature  = req.headers['x-zm-signature'] as string ?? '';
  const rawBody    = JSON.stringify(body);

  if (!verifyZoomSignature(rawBody, timestamp, signature)) {
    console.warn('[Zoom Webhook] Signature tidak valid');
    return void res.status(401).json({ error: 'invalid signature' });
  }

  // ── Handle recording.completed ─────────────────────────────────
  if (body.event === 'recording.completed') {
    try {
      await handleRecordingCompleted(body);
    } catch (err) {
      console.error('[Zoom Webhook] recording.completed error:', (err as Error).message);
    }
  }

  res.status(200).json({ received: true });
});

async function handleRecordingCompleted(body: Record<string, unknown>): Promise<void> {
  const obj         = (body.payload as Record<string, unknown>)?.object as Record<string, unknown>;
  const zoomMtgId   = String(obj?.id ?? '');
  // Gunakan share_url jika ada; fallback ke play_url recording pertama
  const shareUrl    = (obj?.share_url as string | undefined) ??
    ((obj?.recording_files as Array<{ play_url?: string }>)?.[0]?.play_url ?? '');

  if (!zoomMtgId) return;

  // Cari schedule berdasarkan zoom_meeting_id
  const { data: schedule, error: schedErr } = await supabase
    .from('schedules')
    .select('id, program_id, judul_kelas')
    .eq('zoom_meeting_id', zoomMtgId)
    .single();

  if (schedErr || !schedule) {
    console.warn('[Zoom Webhook] Schedule tidak ditemukan untuk meeting_id:', zoomMtgId);
    return;
  }

  // Simpan recording_url ke schedules
  if (shareUrl) {
    await supabase
      .from('schedules')
      .update({ recording_url: shareUrl })
      .eq('id', schedule.id);
  }

  // Cari semua siswa enrolled di program ini
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('siswa_id, profiles!siswa_id(id, nomor_whatsapp, nama_lengkap)')
    .eq('program_id', schedule.program_id)
    .eq('status', 'active');

  if (enrollErr || !enrollments?.length) return;

  const recipients = (enrollments as unknown as Array<{
    siswa_id: string;
    profiles: NotifRecipient;
  }>).map((e) => e.profiles);

  await notifService.dispatchToMany(
    recipients,
    'rekaman_tersedia',
    (nama) => ({
      nama_siswa:    nama,
      judul_kelas:   schedule.judul_kelas as string,
      recording_url: shareUrl,
    }),
  );

  console.log(`[Zoom Webhook] recording.completed → schedule ${schedule.id}, ${recipients.length} siswa dinotifikasi`);
}
