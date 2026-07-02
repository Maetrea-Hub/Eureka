import api from './axios';

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

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];

export const financeApi = {
  async getSummary(): Promise<FinanceSummary> {
    const { data } = await api.get<FinanceSummary>('/finance/summary');
    return data;
  },

  async getByMonth(year: number): Promise<MonthlyRevenue[]> {
    const { data } = await api.get<MonthlyRevenue[]>('/finance/by-month', { params: { year } });
    return data;
  },

  async getByProgram(): Promise<ProgramRevenue[]> {
    const { data } = await api.get<ProgramRevenue[]>('/finance/by-program');
    return data;
  },

  exportCsvUrl(from?: string, to?: string): string {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    const qs = params.toString();
    return `/api/finance/export-csv${qs ? '?' + qs : ''}`;
  },
};
