# Eureka — Platform E-Learning Bimbel Online

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui (via Lovable) |
| Backend | Node.js + Express/Fastify + TypeScript + Prisma ORM |
| Database | Supabase (PostgreSQL) — RLS aktif |
| Auth | Supabase Auth — JWT dual-token, Google OAuth, Email/Password |
| Realtime | Supabase Realtime (notifikasi in-app) |
| Storage | Supabase Storage (PDF, PPT, DOCX) |
| Video | Mux / Bunny.net (streaming, bukan download) |
| Live Kelas | Zoom API (auto-create meeting + absensi otomatis) |
| Payment | Midtrans / Xendit + webhook |
| WhatsApp | Fonnte / Wablas |
| Hosting | Vercel (frontend, auto-deploy GitHub) + Railway/Render (backend) |

---

## Role Pengguna

| Role | Kemampuan Utama |
|---|---|
| **Siswa** | Akses materi, live kelas, absensi, pendaftaran program, notifikasi, pembayaran |
| **Tutor** | CRUD materi (mata pelajaran yang diampu), CRUD siswa terbatas, kelola jadwal, lihat absensi |
| **Admin** | CRUD penuh semua modul, laporan keuangan, CRM, audit log, manajemen keuangan |

---

## Keputusan Arsitektur (Wajib Diikuti)

### Autentikasi & Keamanan

- JWT access token **15 menit** + refresh token **7 hari** via HttpOnly cookie
- Siswa/Tutor: Email/Password **atau** Google OAuth
- Admin: **hanya** Email/Password + **2FA WhatsApp OTP wajib setiap login**
- Verifikasi email otomatis mengaktifkan akun siswa — **tanpa approval Admin**
- RBAC via middleware di setiap endpoint backend
- Rate limiting: **5x gagal login → lockout 15 menit**
- Password di-hash bcrypt cost factor **12**
- Email siswa tidak bisa diubah sendiri — hanya via Admin

### Registrasi & Onboarding

- Landing page **terpisah** dari platform utama (marketing only, tanpa sistem akun)
- Onboarding satu kali setelah login pertama (lengkapi profil, sekolah, kelas)

### Sistem Pilihan Program

Satu modul CRUD tunggal bernama **"Pilihan Program"** — bukan "Tipe Layanan + Paket" terpisah.

| Field | Tipe |
|---|---|
| Nama | text |
| Tipe Layanan | dropdown: Private / Small Class / Regular Class |
| Jenjang | dropdown: SD / SMP / SMA |
| Mata Pelajaran | checkbox: IPA Terpadu / Matematika / B.Inggris / Biologi / Fisika / Kimia (semua selalu tampil) |
| Durasi | text bebas |
| Kapasitas | angka |
| Tarif | nominal rupiah |
| Status | switch aktif / nonaktif |

Constraint:
- Program yang sedang aktif digunakan **tidak bisa dihapus atau diubah kapasitasnya**
- Materi tetap bisa diakses meski program sudah expired

### Pembayaran

- Webhook Midtrans/Xendit otomatis membuka akses program setelah transaksi terpenuhi
- Order expired jika tidak dibayar dalam **48 jam**
- Payment gateway adaptif: nominal kecil → QRIS/transfer bank; nominal besar → semua opsi termasuk cicilan

### Refund Policy

> **Implementasikan persis seperti ini — jangan interpretasi ulang.**

- **Window:** 2×24 jam sejak **tanggal pembayaran berhasil**
- **Pengecualian 1:** Force majeure platform → refund penuh tanpa batas waktu, diproses otomatis Admin
- **Pengecualian 2:** Trial session siswa baru → berlaku **1× per akun**, dalam window 2×24 jam
- Di luar kondisi di atas: **tidak ada refund**

### Manajemen Materi

- Hierarki: **Jenjang → Mata Pelajaran → Topik**
- Tiga tab per topik:
  - **Dokumen** — PDF/PPT/DOCX/ePub, bisa download dan online
  - **Video** — streaming only, **tidak bisa download**
  - **Bank Soal** — pilihan ganda + essay, dengan/tanpa timer
- Akses materi berdasarkan **program yang dibeli siswa**, bukan akses bebas
- Materi yang sudah diakses siswa: hanya bisa **dinonaktifkan**, tidak bisa dihapus

### Live Kelas (Zoom)

- Auto-create meeting saat jadwal dibuat via Zoom API
- Tutor bisa publish jadwal **langsung tanpa approval Admin**
- Absensi otomatis tercatat saat siswa join Zoom
  - Toleransi keterlambatan default **15 menit** (dikonfigurasi Admin)
- Cancel/reschedule → notifikasi otomatis WhatsApp + in-app ke semua siswa terdaftar
- Rekaman otomatis tersimpan, default tersedia **30 hari**

---

## Notifikasi (14 Kategori — Semua Wajib Diimplementasikan)

| # | Kategori | Trigger |
|---|---|---|
| 1 | Pengingat Jadwal Kelas | H-1 & H-0 |
| 2 | Pengingat Kelas | 15 menit sebelum mulai |
| 3 | Kelas Di-Cancel | Saat cancel |
| 4 | Kelas Di-Reschedule | Saat reschedule |
| 5 | Pembayaran Berhasil | Webhook sukses |
| 6 | Pembayaran Gagal/Expired | Webhook gagal / 48 jam terlewat |
| 7 | Perpanjangan Program | H-7 & H-3 |
| 8 | Refund Disetujui/Ditolak | Saat Admin memproses |
| 9 | Materi Baru Dipublish | Saat Tutor publish |
| 10 | Rekaman Kelas Tersedia | Setelah meeting selesai |
| 11 | Email Verifikasi Akun | Saat registrasi |
| 12 | Konfirmasi Password Berhasil Diubah | Saat ubah password |
| 13 | Siswa Baru Mendaftar Program | Notifikasi ke Admin/Tutor |
| 14 | Pengajuan Refund Masuk | Notifikasi ke Admin |

**Channel:**
- WhatsApp (Fonnte/Wablas) untuk semua 14 kategori
- Supabase Realtime untuk in-app saat user online

**Template:** Di-hardcode oleh developer — **tidak bisa diedit Admin**. Variabel dinamis: `{{nama_siswa}}`, `{{mata_pelajaran}}`, `{{link_zoom}}`, dll.

**Retry:** WhatsApp gagal kirim → retry 1× setelah 5 menit.

---

## Konvensi Kode

### Penamaan

- File: `kebab-case` (contoh: `student-dashboard.tsx`)
- Komponen React: `PascalCase`
- Bahasa: **TypeScript di seluruh backend dan frontend**

### Struktur Folder Backend (Modular per Domain)

```
src/
├── auth/
├── users/
├── programs/
├── materials/
├── meetings/
├── payments/
├── notifications/
├── finance/
├── crm/
└── audit/
```

Setiap modul:

```
<domain>/
├── controller.ts
├── service.ts
├── repository.ts
└── types.ts
```

### Commit Message

Gunakan **Conventional Commits**:
- `feat:` — fitur baru
- `fix:` — perbaikan bug
- `refactor:` — refaktor tanpa perubahan fungsional
- `docs:` — perubahan dokumentasi

---

## Aturan Supabase MCP (Wajib Dipatuhi)

- **Selalu** gunakan Supabase MCP dalam mode `read_only=true` kecuali sedang aktif menulis schema/migration
- **Jangan pernah** terhubung ke project Supabase **production** dari MCP — hanya development project
- Setelah selesai menulis schema, **segera** kembalikan ke `read_only=true`
- **RLS wajib aktif** di semua tabel yang menyimpan data siswa, pembayaran, dan transaksi
- Saat membuat migration baru, sertakan **RLS policy di file migration yang sama** — jangan pisahkan ke file berbeda

---

## Peringatan Fitur Sensitif

Refund, pembayaran, dan akses materi menyentuh data finansial. **Selalu konfirmasi logic sebelum implementasi yang mengubah data finansial** — jangan langsung eksekusi perubahan tanpa verifikasi eksplisit.

---

## Progress Log

### Selesai

| Blok | Deskripsi | Commit |
|------|-----------|--------|
| 1 | Inisialisasi monorepo (`frontend/`, `backend/`, `supabase/`) + CLAUDE.md | `3c39ade` |
| 2 | Migration Supabase: schema auth (ENUM `user_role`, tabel `profiles` + `admin_otp_sessions`, trigger `handle_new_user` SECURITY DEFINER, RLS 5 policy pada `profiles`) | `19faf57` |
| 2b | Migration tambahan: kolom `otp_attempts` + fungsi atomic `increment_otp_attempts()` | `19faf57` |
| 3–5 | Backend Express + TypeScript — modul `auth/`: `repository`, `service`, `controller`, middleware `requireAuth` (TOKEN_EXPIRED vs TOKEN_INVALID), `requireRole`, rate limiter dual-layer (IP+email 5×/15min + email-only 10×/15min), enkripsi AES-256-GCM token admin, WhatsApp provider abstraction (Fonnte) | `8267220` |
| 6 | Frontend scaffold: Vite 8 + React 19 + Tailwind v4 + shadcn/ui (12 komponen), `useAuth` hook, `ProtectedRoute` (role guard + onboarding redirect), router lazy-load, axios interceptor TOKEN_EXPIRED retry | `a1efcc6` |
| 7 | Frontend auth pages & komponen lengkap: `RegisterForm`, `LoginSiswaForm`, `LoginAdminForm` (2-step InputOTP → `setSession`), `OnboardingForm`, `GoogleOnboardingForm`, `GoogleAuthButton`, `AuthLayout`, `ForgotPassword` (`resetPasswordForEmail`), `ResetPassword` (`PASSWORD_RECOVERY` event), `src/lib/errors.ts` (`extractApiError` + `normalizeWA`) | `bc0133f` |
| 8 | Dashboard per role: `DashboardLayout` (sidebar + nav + avatar + logout), `StatCard`, `EmptyState` — Siswa (jadwal/program/materi stats), Tutor (siswa/jadwal/materi stats), Admin (4 KPI cards + recent activity grid) | `9308825` |
| 9 | Modul Pilihan Program CRUD Admin: migration `programs` (ENUM uppercase, CHECK `mata_pelajaran`, RLS 2 policy), backend 4 file (`types/repository/service/controller`), frontend `ProgramTable` + `ProgramFormSheet` + `DeleteDialog` + `MataPelajaranField`, route `/admin/programs` | `96525e2` |
| 10 | Manajemen Materi: migration `materials` + `questions` (4 ENUM, RLS 6+3 policy), backend 4 file (`types/repository/service/controller`, 10 endpoint), frontend 9 komponen (`MaterialTable`, `MaterialFormSheet`, `MaterialDeleteDialog`, `MaterialStatusBadge`, `BankSoalManager` dengan `useFieldArray` + `discriminatedUnion`, `useMaterials` hook), 3 halaman (Siswa/Tutor/Admin), route `/*/materials` | `ace9afb` |
| 11 | Live Kelas: migration `schedules`+`schedule_host_urls`+`attendances`+`settings` (2 ENUM, 14 RLS policy, `zoom_start_url` diproteksi di tabel terpisah), Zoom OAuth S2S token cache, `ZoomClient` (create/update/delete), node-cron scheduler (H-1/H-0/15min polling), backend modul schedules 4 file (8 endpoint), frontend 6 komponen + 3 halaman (Tutor/Admin/Siswa) + `ScheduleFormSheet`/`CancelDialog`/`RescheduleDialog`/`AttendanceTable` | `448bbab` |
| 12 | Pembayaran + Enrollments: migration `20260701_006_payments.sql` (4 ENUM, 4 tabel baru, ALTER programs+durasi_hari, 15 RLS policy, DROP+RECREATE 2 policy existing), Midtrans Snap native fetch, backend `orders/`+`enrollments/`+`refunds/`+`payments/webhook` (15 file), frontend `payments-api`+2 hooks+2 komponen+3 halaman (`siswa/programs`, `siswa/transactions`, `admin/refunds`), wire semua 6 Known Gaps | `20aace7` |
| 13 | Notifikasi: migration `20260702_007_notifications.sql` (ENUM 16 nilai, tabel `notifications`, RLS 2 policy, ALTER `schedules` + `recording_url`, Supabase Realtime), backend `notifications/` 4 file + `zoom/webhook.ts` (Zoom recording.completed), rewrite `notification-scheduler.ts` (cron perpanjangan H-7/H-3), integrasi dispatch ke `payments/webhook`, `refunds/service`, `schedules/service`, `materials/service`, `auth/service` + `changePassword`, frontend `notifications-api` + `useNotifications` (Realtime subscribe) + `NotificationBell` + `NotificationsList` + 3 halaman notif (siswa/tutor/admin) + router 3 route baru, nav Bell di semua halaman | — |

### Berikutnya

| Blok | Deskripsi |
|------|-----------|
| 14 | CRM + Laporan Keuangan + Audit Log (Admin) |

### Catatan Implementasi Penting

- **bcrypt** diganti `bcryptjs` (hindari CVE tar via node-pre-gyp)
- shadcn di Windows buat folder `@\` literal — fix: `Copy-Item "frontend\@\components\ui\*" "frontend\src\components\ui\" -Force; Remove-Item -Recurse -Force "frontend\@"`
- MemoryStore rate limiter — upgrade ke RedisStore saat backend di-scale >1 instance
- Admin 2FA: token Supabase di-encrypt AES-256-GCM di DB, hanya dikembalikan ke client setelah OTP terverifikasi
- `markOtpSessionUsed()` dipanggil **sebelum** `decryptAES()` untuk mencegah race condition double-submit
- Midtrans Snap.js dimuat dinamis di `CheckoutDialog.tsx` menggunakan `VITE_MIDTRANS_CLIENT_KEY` + `VITE_MIDTRANS_IS_PRODUCTION`
- Webhook `/api/payments/webhook` sengaja **tidak** dibungkus `requireAuth` — Midtrans memanggil dari server mereka; autentikasi via SHA512 signature verification
- `is_first_enrollment` dicek dengan `countAllBySiswa()` (semua status) **SEBELUM** insert enrollment baru
- `enrollments` menggunakan partial unique index (`WHERE status = 'active'`) — bukan UNIQUE constraint biasa — untuk memungkinkan re-enroll setelah expired/refunded
- `programs.durasi_hari` (INTEGER nullable): untuk kalkulasi `expires_at` enrollment; `durasi` (TEXT) tetap untuk display ke user
- `rekaman_tersedia` menggunakan Zoom webhook `recording.completed` (bukan polling `jam_selesai`) — recording processing time tidak deterministik
- Zoom webhook signature: `v0=HMAC-SHA256("v0:{timestamp}:{JSON.stringify(body)}", SECRET_TOKEN)` dibanding header `x-zm-signature`; URL validation challenge: `{ plainToken, encryptedToken: HMAC-SHA256(plainToken, SECRET_TOKEN) }`
- `dispatch()` memanggil `void sendWaWithRetry()` (fire-and-forget) — WA retry 1× setelah 5 menit dalam lambda async terpisah per user (tidak blokir `Promise.allSettled`)
- `PATCH /api/notifications/read-all` harus didaftarkan **sebelum** `PATCH /api/notifications/:id/read` — Express routing ambiguity
- Backend pakai `SUPABASE_SERVICE_ROLE_KEY` untuk insert ke `notifications` (bypass RLS) karena beberapa dispatch terjadi tanpa user session (e.g. `verifikasi_email` saat registrasi)
- Frontend Realtime: `supabase.channel().on('postgres_changes', {event:'INSERT', filter:'user_id=eq.{id}'})` — prepend ke state, increment unread badge
