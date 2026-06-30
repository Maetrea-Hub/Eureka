import { IWhatsAppProvider } from './interface';
import { FonnteProvider } from './fonnte';

let _instance: IWhatsAppProvider | null = null;

/**
 * Factory singleton — baca WHATSAPP_PROVIDER dari env.
 * Instance dibuat sekali dan di-reuse untuk setiap pemanggilan.
 *
 * Menambah provider baru:
 *   1. Buat src/lib/whatsapp/<provider>.ts implements IWhatsAppProvider
 *   2. Import dan tambah case di bawah
 *   3. Set WHATSAPP_PROVIDER=<provider> di .env
 */
export function getWhatsAppProvider(): IWhatsAppProvider {
  if (_instance) return _instance;

  const provider = (process.env.WHATSAPP_PROVIDER ?? 'fonnte').toLowerCase();

  switch (provider) {
    case 'fonnte':
      _instance = new FonnteProvider();
      break;

    // case 'wablas':
    //   _instance = new WablasProvider();
    //   break;

    default:
      throw new Error(
        `WHATSAPP_PROVIDER "${provider}" tidak dikenali. Provider yang tersedia: fonnte`,
      );
  }

  return _instance;
}
