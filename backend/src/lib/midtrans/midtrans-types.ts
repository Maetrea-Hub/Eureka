export interface SnapTokenRequest {
  transaction_details: {
    order_id:     string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    phone?:      string;
  };
  expiry?: {
    start_time?: string;
    unit:        'minutes' | 'hours' | 'days';
    duration:    number;
  };
}

export interface SnapTokenResponse {
  token:        string;
  redirect_url: string;
}

export interface MidtransWebhookPayload {
  transaction_time:   string;
  transaction_status: string; // 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'refund'
  transaction_id:     string;
  status_message:     string;
  status_code:        string;
  signature_key:      string;
  payment_type:       string;
  order_id:           string;
  merchant_id:        string;
  gross_amount:       string; // string dari Midtrans, bukan number
  fraud_status?:      string;
  currency:           string;
  refund_amount?:     string;
}
