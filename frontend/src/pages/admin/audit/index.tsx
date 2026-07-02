import { useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Calendar, CreditCard,
  FileText, LayoutDashboard, MessageSquare, Package,
  RotateCcw, Settings2, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAudit } from '@/hooks/useAudit';
import { ACTION_LABEL } from '@/lib/audit-api';

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

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  tutor: 'bg-blue-100 text-blue-700',
  siswa: 'bg-green-100 text-green-700',
};

export default function AdminAudit() {
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');

  const { logs, isLoading, hasMore, applyFilters, loadMore } = useAudit();

  function handleFilter() {
    applyFilters({
      action: filterAction || undefined,
      from:   filterFrom   ? filterFrom + 'T00:00:00Z' : undefined,
      to:     filterTo     ? filterTo   + 'T23:59:59Z' : undefined,
    });
  }

  function handleReset() {
    setFilterAction(''); setFilterFrom(''); setFilterTo('');
    applyFilters({ action: undefined, from: undefined, to: undefined });
  }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Audit Log">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Audit Log</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{logs.length} entri dimuat</p>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Action</p>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua action</SelectItem>
              {Object.entries(ACTION_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Dari</p>
          <Input type="date" className="w-36" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Sampai</p>
          <Input type="date" className="w-36" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
        </div>
        <Button onClick={handleFilter}>Terapkan</Button>
        <Button variant="ghost" onClick={handleReset}>Reset</Button>
      </div>

      {/* Table */}
      {isLoading && !logs.length ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !logs.length ? (
        <EmptyState icon={FileText} message="Tidak ada log" description="Belum ada aktivitas yang tercatat" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Aktor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">
                        {log.actor?.nama_lengkap ?? log.actor_id?.slice(0, 8) ?? '—'}
                      </div>
                      {log.actor_role && (
                        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLOR[log.actor_role] ?? 'bg-muted text-muted-foreground'}`}>
                          {log.actor_role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.entity_type && <span>{log.entity_type}</span>}
                      {log.entity_id && <span className="ml-1 opacity-60">#{log.entity_id.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                      {log.detail ? (
                        <span className="truncate block">{JSON.stringify(log.detail)}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading ? 'Memuat...' : 'Muat lebih banyak'}
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
