import { getWhatsAppProvider } from '../lib/whatsapp/index.js';
import * as repo from './repository.js';
import { buildTemplate } from './templates.js';
import type { NotificationKategori, NotificationVars, NotifRecipient } from './types.js';

// ── Core dispatch ─────────────────────────────────────────────

export async function dispatch(
  userId:    string,
  waPhone:   string | null,
  kategori:  NotificationKategori,
  vars:      NotificationVars,
): Promise<void> {
  const { judul, pesan } = buildTemplate(kategori, vars);

  // In-app: insert to notifications table (non-blocking for caller)
  try {
    await repo.insert({ user_id: userId, kategori, judul, pesan });
  } catch (err) {
    console.error('[Notif] Insert gagal:', (err as Error).message);
  }

  // WhatsApp: kirim dengan retry 1x setelah 5 menit jika gagal
  if (waPhone) {
    void sendWaWithRetry(waPhone, pesan);
  }
}

// ── Bulk dispatch (e.g., ke semua siswa enrolled) ─────────────

export async function dispatchToMany(
  recipients: NotifRecipient[],
  kategori:   NotificationKategori,
  buildVars:  (nama: string) => NotificationVars,
): Promise<void> {
  await Promise.allSettled(
    recipients.map((r) =>
      dispatch(r.id, r.nomor_whatsapp, kategori, buildVars(r.nama_lengkap || 'Siswa')),
    ),
  );
}

// ── WA retry (fire-and-forget: caller tidak perlu await) ──────

async function sendWaWithRetry(phone: string, message: string): Promise<void> {
  const wa = getWhatsAppProvider();
  const result = await wa.sendMessage(phone, message);
  if (!result.success) {
    console.warn(`[Notif] WA gagal → retry 1x in 5min → ${phone}`);
    await new Promise((r) => setTimeout(r, 5 * 60_000));
    await wa.sendMessage(phone, message);
  }
}
