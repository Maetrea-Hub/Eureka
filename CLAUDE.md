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
