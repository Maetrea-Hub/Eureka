import { useState } from 'react';
import {
  BookOpen, Calendar, CreditCard, LayoutDashboard, Package,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { RefundRequestDialog } from '@/components/payments/RefundRequestDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
  formatRupiah, isWithinRefundWindow,
  type Order,
} from '@/lib/payments-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/siswa',              icon: LayoutDashboard },
  { label: 'Program Saya', href: '/siswa/programs',     icon: Package },
  { label: 'Jadwal Kelas', href: '/siswa/schedules',    icon: Calendar },
  { label: 'Materi',       href: '/siswa/materials',    icon: BookOpen },
  { label: 'Pembayaran',   href: '/siswa/transactions', icon: CreditCard },
];

function OrderRow({ order, onRefund }: { order: Order; onRefund: (order: Order) => void }) {
  const statusColor = ORDER_STATUS_COLOR[order.status];
  const statusLabel = ORDER_STATUS_LABEL[order.status];
  const canRefund   = order.status === 'paid' && isWithinRefundWindow(order.expired_at);
  const programNama = (order as Order & { programs?: { nama: string } }).programs?.nama ?? '—';

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{programNama}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
          {' · '}ID: {order.midtrans_order_id}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold">{formatRupiah(order.nominal)}</p>
          {order.status === 'paid' && order.expired_at && (
            <p className="text-xs text-muted-foreground">
              Refund s/d: {new Date(order.expired_at).toLocaleDateString('id-ID')}
            </p>
          )}
        </div>
        <Badge className={statusColor}>{statusLabel}</Badge>
        {canRefund && (
          <Button variant="outline" size="sm" onClick={() => onRefund(order)}>
            Refund
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SiswaTransactions() {
  const { orders, isLoading, refetch } = useOrders();
  const [refundOrder, setRefundOrder]  = useState<Order | null>(null);

  return (
    <DashboardLayout navItems={navItems} pageTitle="Riwayat Pembayaran">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Riwayat Pembayaran</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{orders.length} transaksi</p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !orders.length ? (
        <EmptyState
          icon={CreditCard}
          message="Belum ada transaksi"
          description="Transaksi akan muncul di sini setelah Anda membeli program"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} onRefund={setRefundOrder} />
          ))}
        </div>
      )}

      {refundOrder && (
        <RefundRequestDialog
          open={!!refundOrder}
          onClose={() => setRefundOrder(null)}
          onSubmitted={() => void refetch()}
          orderId={refundOrder.id}
          programNama={(refundOrder as Order & { programs?: { nama: string } }).programs?.nama ?? '—'}
          nominal={refundOrder.nominal}
        />
      )}
    </DashboardLayout>
  );
}
