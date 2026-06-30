import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? '15', 10);
const WINDOW_MS = LOCKOUT_MINUTES * 60 * 1_000;

// CATATAN UPGRADE: Kedua limiter di bawah menggunakan MemoryStore bawaan
// express-rate-limit — tidak persisten (reset saat restart) dan tidak sync
// antar instance. Saat backend di-scale lebih dari 1 instance, ganti ke:
//   npm install rate-limit-redis ioredis
//   import RedisStore from 'rate-limit-redis'
//   store: new RedisStore({ client: redisClient })

// Limiter 1: per IP+email — mencegah brute force dari satu IP
// Kunci gabungan agar satu IP di kantor/NAT tidak kena lockout massal
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Terlalu banyak percobaan login. Coba lagi dalam ${LOCKOUT_MINUTES} menit.`,
  },
  keyGenerator: (req: Request): string => {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
      req.socket.remoteAddress ??
      'unknown';
    const email = (req.body?.email as string | undefined) ?? '';
    return `ipmail:${ip}:${email.toLowerCase()}`;
  },
  skip: (): boolean => process.env.NODE_ENV === 'test',
});

// Limiter 2: per email saja — mencegah bypass via rotasi IP/proxy
// Threshold lebih longgar (2× limit) agar legitimate user dari device/IP berbeda
// tidak langsung kena lock, tapi tetap ada cap total per akun
export const loginEmailRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS * 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Akun ini terkunci sementara. Coba lagi dalam ${LOCKOUT_MINUTES} menit.`,
  },
  keyGenerator: (req: Request): string => {
    const email = (req.body?.email as string | undefined) ?? '';
    return `email:${email.toLowerCase()}`;
  },
  skip: (): boolean => process.env.NODE_ENV === 'test',
});
