import { createHash } from 'node:crypto';
import type { SnapTokenRequest, SnapTokenResponse, MidtransWebhookPayload } from './midtrans-types.js';

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const SERVER_KEY    = process.env.MIDTRANS_SERVER_KEY ?? '';

const SNAP_BASE_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export async function createSnapToken(req: SnapTokenRequest): Promise<SnapTokenResponse> {
  if (!SERVER_KEY) throw new Error('MIDTRANS_SERVER_KEY tidak dikonfigurasi');

  const authHeader = 'Basic ' + Buffer.from(`${SERVER_KEY}:`).toString('base64');

  const res = await fetch(SNAP_BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body:    JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans Snap error ${res.status}: ${text}`);
  }

  return res.json() as Promise<SnapTokenResponse>;
}

export function verifyWebhookSignature(
  payload: Pick<MidtransWebhookPayload, 'order_id' | 'status_code' | 'gross_amount' | 'signature_key'>,
): boolean {
  if (!SERVER_KEY) return false;
  const expected = createHash('sha512')
    .update(payload.order_id + payload.status_code + payload.gross_amount + SERVER_KEY)
    .digest('hex');
  return expected === payload.signature_key;
}
