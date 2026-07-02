import { useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Calendar, CreditCard,
  FileText, LayoutDashboard, MessageSquare, Package,
  RotateCcw, Settings2, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useFinanceSummary, useFinanceByMonth, useFinanceByProgram,
} from '@/hooks/useFinance';
import { formatRupiah, MONTH_SHORT } from '@/lib/finance-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',                icon: LayoutDashboard },
  { label: 'Siswa',                                           icon: Users },
  { label: 'Tutor',                                           icon: Settings2 },
  { label: 'Pilihan Program',  href: '/admin/programs',       icon: Package },
  { label: 'Materi',           href: '/admin/materials',      icon: BookOpen },
  { label: 'Jadwal Kelas',     href: '/admin/schedules',      icon: Calendar },
  { label: 'Pembayaran',                                      icon: CreditCard },
  { label: 'Refund Requests',  href: '/admin/refunds',        icon: RotateCcw },
  { label: 'Notifikasi',       href: '/admin/notifications',  icon: Bell },
  { label: 'Laporan Keuangan', href: '/admin/finance',        icon: BarChart3 },
  { label: 'CRM',              href: '/admin/crm',            icon: MessageSquare },
  { label: 'Audit Log',        href: '/admin/audit',          icon: FileText },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function BarChart({ data }: { data: { month: number; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1 h-36 pt-4">
      {data.map(d => {
        const pct = Math.round((d.total / max) * 100);
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground leading-none">
              {d.total > 0 ? formatRupiah(d.total).replace('Rp\xa0', '').replace(/\./g, ',') : ''}
            </span>
            <div
              className="w-full rounded-t bg-primary/80 transition-all duration-300"
              style={{ height: `${pct}%`, minHeight: d.total > 0 ? '4px' : '0' }}
            />
            <span className="text-[10px] text-muted-foreground">{MONTH_SHORT[d.month - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminFinance() {
  const [year,      setYear]      = useState(CURRENT_YEAR);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo,   setExportTo]   = useState('');

  const { summary, isLoading: loadingSummary }       = useFinanceSummary();
  const { data: byMonth, isLoading: loadingMonth }   = useFinanceByMonth(year);
  const { data: byProgram, isLoading: loadingProg }  = useFinanceByProgram();

  function handleExport() {
    const params = new URLSearchParams();
    if (exportFrom) params.set('from', exportFrom);
    if (exportTo)   params.set('to',   exportTo);
    const qs  = params.toString();
    const url = `/api/finance/export-csv${qs ? '?' + qs : ''}`;
    window.open(url, '_blank', 'noopener');
  }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Laporan Keuangan">
      {/* ── Summary cards ── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {loadingSummary ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))
        ) : summary ? (
          <>
            <StatCard label="Total Masuk" value={formatRupiah(summary.total_masuk)}
              sublabel={`${summary.count_paid} transaksi`} icon={BarChart3} />
            <StatCard label="Pending" value={formatRupiah(summary.total_pending)}
              sublabel={`${summary.count_pending} menunggu`} icon={CreditCard} />
            <StatCard label="Total Refund" value={formatRupiah(summary.total_refunded)}
              sublabel="" icon={RotateCcw} />
          </>
        ) : (
          <p className="col-span-3 text-sm text-muted-foreground">Gagal memuat summary</p>
        )}
      </div>

      {/* ── Revenue per bulan ── */}
      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold">Revenue per Bulan</h3>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loadingMonth ? (
          <div className="h-36 animate-pulse rounded-lg bg-muted" />
        ) : (
          <BarChart data={byMonth} />
        )}
        <p className="mt-2 text-right text-sm font-semibold">
          Total {year}: {formatRupiah(byMonth.reduce((s, d) => s + d.total, 0))}
        </p>
      </div>

      {/* ── Revenue per program ── */}
      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 font-semibold">Revenue per Program</h3>
        {loadingProg ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : !byProgram.length ? (
          <EmptyState icon={BarChart3} message="Belum ada data" description="Data akan muncul setelah ada transaksi selesai" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Program</th>
                  <th className="pb-2 text-right font-medium">Transaksi</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {byProgram.map(p => (
                  <tr key={p.program_id} className="border-b last:border-0">
                    <td className="py-2">{p.program_nama}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.count}×</td>
                    <td className="py-2 text-right font-semibold">{formatRupiah(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Export CSV ── */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 font-semibold">Export CSV</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Download daftar transaksi berhasil (status paid). Filter tanggal bersifat opsional.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Dari tanggal</Label>
            <Input type="date" className="w-40" value={exportFrom} onChange={e => setExportFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai tanggal</Label>
            <Input type="date" className="w-40" value={exportTo} onChange={e => setExportTo(e.target.value)} />
          </div>
          <Button onClick={handleExport}>
            Download CSV
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
