export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Kontrak yang harus diimplementasikan setiap WhatsApp provider.
 * Untuk menambah provider baru (Wablas, Twilio, dsb):
 *   1. Buat file <nama>.ts yang implements interface ini
 *   2. Tambah case di whatsapp/index.ts
 *   3. Set WHATSAPP_PROVIDER=<nama> di .env
 */
export interface IWhatsAppProvider {
  sendMessage(to: string, message: string): Promise<SendMessageResult>;
}
