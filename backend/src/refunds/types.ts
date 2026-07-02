export type RefundTipe   = 'standard' | 'force_majeure' | 'trial_session';
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  id:             string;
  order_id:       string;
  siswa_id:       string;
  alasan:         string;
  tipe:           RefundTipe;
  status:         RefundStatus;
  diproses_oleh:  string | null;
  diproses_at:    string | null;
  created_at:     string;
}

export interface RefundRequestInput {
  order_id: string;
  alasan:   string;
}

export interface ForceRefundInput {
  order_id: string;
  alasan:   string;
}

export interface ProcessRefundInput {
  action: 'approved' | 'rejected';
}
