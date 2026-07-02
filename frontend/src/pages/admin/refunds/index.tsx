import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, BookOpen, Calendar, CreditCard, FileText,
  LayoutDashboard, MessageSquare, Package, RotateCcw, Settings2, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import {
  refundsApi, REFUND_STATUS_LABEL, REFUND_TIPE_LABEL, formatRupiah,
  type RefundRequest, type RefundStatus,
} from '@/lib/payments-api';
import { extractApiError } from '@/lib/errors';

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',           icon: LayoutDashboard },
  { label: 'Siswa',                                      icon: Users },
  { label: 'Tutor',                                      icon: Settings2 },
  { label: 'Pilihan Program',  href: '/admin/programs',  icon: Package },
  { label: 'Materi',           href: '/admin/materials', icon: BookOpen },
  { label: 'Jadwal Kelas',     href: '/admin/schedules', icon: Calendar },
  { label: 'Pembayaran',                                 icon: CreditCard },
  { label: 'Refund Requests',  href: '/admin/refunds',   icon: RotateCcw },
  { label: 'Laporan Keuangan',                           icon: BarChart3 },
  { label: 'CRM',                                        icon: MessageSquare },
  { label: 'Audit Log',                                  icon: FileText },
];

const STATUS_COLOR: Record<RefundStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-600',
};

// ── Force Majeure Dialog ──────────────────────────────────────

function ForceMajeureDialog({
  open, onClose, onDone,
}: {
  open:    boolean;
  onClose: () => void;
  onDone:  () => void;
}) {
  const { orders }                    = useOrders();
  const [orderId,    setOrderId]      = useState('');
  const [alasan,     setAlasan]       = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const paidOrders = orders.filter((o) => o.status === 'paid');

  async function handleSubmit() {
    if (!orderId || !alasan.trim()) { toast.error('Pilih order dan isi alasan'); return; }
    setSubmitting(true);
    try {
      await refundsApi.forceMajeure(orderId, alasan.trim());
      toast.success('Force Majeure refund berhasil diproses');
      setOrderId(''); setAlasan('');
      onDone(); onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOrderId(''); setAlasan(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Force Majeure Refund</DialogTitle>
          <DialogDescription>
            Proses refund penuh tanpa batas window waktu. Hanya untuk kondisi force majeure platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih order..." />
              </SelectTrigger>
              <SelectContent>
                {paidOrders.map((o) => {
                  const prog = (o as typeof o & { programs?: { nama: string } }).programs;
                  return (
                    <SelectItem key={o.id} value={o.id}>
                      {prog?.nama ?? o.program_id} — {formatRupiah(o.nominal)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alasan Force Majeure</Label>
            <Textarea
              placeholder="Jelaskan kondisi force majeure..."
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Batal</Button>
            <Button variant="destructive" className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Proses Refund'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function AdminRefunds() {
  const [refunds,    setRefunds]    = useState<RefundRequest[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showForce,  setShowForce]  = useState(false);

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await refundsApi.list();
      setRefunds(data);
    } catch {
      setRefunds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRefunds(); }, [fetchRefunds]);

  async function handleProcess(id: string, action: 'approved' | 'rejected') {
    setProcessing(id);
    try {
      await refundsApi.process(id, action);
      toast.success(action === 'approved' ? 'Refund disetujui' : 'Refund ditolak');
      void fetchRefunds();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Refund Requests">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Refund Requests</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {refunds.filter((r) => r.status === 'pending').length} menunggu proses
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowForce(true)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Force Majeure
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !refunds.length ? (
        <EmptyState
          icon={RotateCcw}
          message="Tidak ada refund request"
          description="Pengajuan refund dari siswa akan muncul di sini"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {refunds.map((r) => {
            const siswa   = (r as typeof r & { siswa?: { nama_lengkap: string } }).siswa;
            const program = (r as typeof r & { orders?: { programs?: { nama: string }; nominal: number } }).orders;

            return (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{siswa?.nama_lengkap ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">
                      {program?.programs?.nama ?? '—'} · {formatRupiah(program?.nominal ?? 0)}
                    </p>
                    <p className="mt-1 text-sm">{r.alasan}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge className={STATUS_COLOR[r.status]}>{REFUND_STATUS_LABEL[r.status]}</Badge>
                      <Badge variant="outline">{REFUND_TIPE_LABEL[r.tipe]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={processing === r.id}
                        onClick={() => handleProcess(r.id, 'rejected')}
                      >
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        disabled={processing === r.id}
                        onClick={() => handleProcess(r.id, 'approved')}
                      >
                        {processing === r.id ? 'Memproses...' : 'Setujui'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ForceMajeureDialog
        open={showForce}
        onClose={() => setShowForce(false)}
        onDone={() => void fetchRefunds()}
      />
    </DashboardLayout>
  );
}
