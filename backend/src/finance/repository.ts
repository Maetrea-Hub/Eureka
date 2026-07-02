import { supabase } from '../lib/supabase.js';
import type { FinanceSummary, MonthlyRevenue, ProgramRevenue, ExportRow } from './types.js';

export async function getSummary(): Promise<FinanceSummary> {
  const { data, error } = await supabase.from('orders').select('status, nominal');
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    total_masuk:    rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.nominal, 0),
    total_pending:  rows.filter(r => ['created', 'pending'].includes(r.status)).reduce((s, r) => s + r.nominal, 0),
    total_refunded: rows.filter(r => r.status === 'refunded').reduce((s, r) => s + r.nominal, 0),
    count_paid:     rows.filter(r => r.status === 'paid').length,
    count_pending:  rows.filter(r => ['created', 'pending'].includes(r.status)).length,
  };
}

export async function getByMonth(year: number): Promise<MonthlyRevenue[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('nominal, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', `${year}-01-01T00:00:00Z`)
    .lt('paid_at',  `${year + 1}-01-01T00:00:00Z`);
  if (error) throw new Error(error.message);

  const byMonth: Record<number, number> = {};
  for (const o of data ?? []) {
    const m = new Date(o.paid_at as string).getMonth() + 1;
    byMonth[m] = (byMonth[m] ?? 0) + (o.nominal as number);
  }
  return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: byMonth[i + 1] ?? 0 }));
}

export async function getByProgram(): Promise<ProgramRevenue[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('nominal, program_id, programs(nama)')
    .eq('status', 'paid');
  if (error) throw new Error(error.message);

  const map: Record<string, ProgramRevenue> = {};
  for (const o of data ?? []) {
    const prog = (o as unknown as { programs: { nama: string } | null }).programs;
    const id   = o.program_id as string;
    const nama = prog?.nama ?? 'Unknown';
    if (!map[id]) map[id] = { program_id: id, program_nama: nama, total: 0, count: 0 };
    map[id].total += o.nominal as number;
    map[id].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export async function getForExport(from?: string, to?: string): Promise<ExportRow[]> {
  let q = supabase
    .from('orders')
    .select('id, siswa_id, program_id, nominal, paid_at')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });

  if (from) q = q.gte('paid_at', from);
  if (to)   q = q.lte('paid_at', to);

  const { data: orders, error } = await q;
  if (error) throw new Error(error.message);
  if (!orders?.length) return [];

  const siswaIds   = [...new Set(orders.map(o => o.siswa_id as string))];
  const programIds = [...new Set(orders.map(o => o.program_id as string))];

  const [{ data: profiles }, { data: programs }] = await Promise.all([
    supabase.from('profiles').select('id, nama_lengkap, email').in('id', siswaIds),
    supabase.from('programs').select('id, nama').in('id', programIds),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  const programMap = Object.fromEntries((programs ?? []).map(p => [p.id, p]));

  return orders.map(o => ({
    order_id:     o.id as string,
    siswa_nama:   (profileMap[o.siswa_id as string] as { nama_lengkap: string } | undefined)?.nama_lengkap ?? '',
    siswa_email:  (profileMap[o.siswa_id as string] as { email: string }        | undefined)?.email        ?? '',
    program_nama: (programMap[o.program_id as string] as { nama: string }       | undefined)?.nama         ?? '',
    nominal:      o.nominal as number,
    paid_at:      (o.paid_at as string | null) ?? '',
  }));
}
