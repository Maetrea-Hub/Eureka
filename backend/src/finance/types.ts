export interface FinanceSummary {
  total_masuk:    number;
  total_pending:  number;
  total_refunded: number;
  count_paid:     number;
  count_pending:  number;
}

export interface MonthlyRevenue {
  month: number;
  total: number;
}

export interface ProgramRevenue {
  program_id:   string;
  program_nama: string;
  total:        number;
  count:        number;
}

export interface ExportRow {
  order_id:     string;
  siswa_nama:   string;
  siswa_email:  string;
  program_nama: string;
  nominal:      number;
  paid_at:      string;
}
