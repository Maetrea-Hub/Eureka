import axios, { AxiosError } from 'axios';
import { IWhatsAppProvider, SendMessageResult } from './interface';

interface FonnteResponse {
  status: boolean;
  id?: string;
  reason?: string;
  detail?: string;
}

const FONNTE_API_URL = 'https://api.fonnte.com/send';
const REQUEST_TIMEOUT_MS = 10_000;

export class FonnteProvider implements IWhatsAppProvider {
  private readonly token: string;

  constructor() {
    const token = process.env.FONNTE_TOKEN;
    if (!token) throw new Error('FONNTE_TOKEN tidak ditemukan di environment');
    this.token = token;
  }

  async sendMessage(to: string, message: string): Promise<SendMessageResult> {
    try {
      const { data } = await axios.post<FonnteResponse>(
        FONNTE_API_URL,
        { target: to, message },
        {
          headers: { Authorization: this.token },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      if (data.status) {
        return { success: true, messageId: data.id };
      }

      return {
        success: false,
        error: data.reason ?? data.detail ?? 'Fonnte: status false tanpa pesan error',
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = (err.response?.data as FonnteResponse | undefined)?.reason;
        return {
          success: false,
          error: detail ?? err.message,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network error',
      };
    }
  }
}
