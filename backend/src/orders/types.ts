export type OrderStatus = 'pending' | 'paid' | 'expired' | 'refunded' | 'cancelled';

export interface Order {
  id:                string;
  siswa_id:          string;
  program_id:        string;
  midtrans_order_id: string;
  snap_token:        string | null;
  nominal:           number;
  status:            OrderStatus;
  payment_date:      string | null;
  expired_at:        string | null;  // refund window: payment_date + 48h
  order_expires_at:  string;          // Midtrans expiry: created_at + 24h
  created_at:        string;
  updated_at:        string;
}

export interface OrderCreateInput {
  siswa_id:          string;
  program_id:        string;
  midtrans_order_id: string;
  snap_token:        string;
  nominal:           number;
  order_expires_at:  string;
}
