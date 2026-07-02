import { useState } from 'react';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ordersApi, formatRupiah, type Order } from '@/lib/payments-api';
import { extractApiError } from '@/lib/errors';

// Declare window.snap dari Midtrans Snap.js
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?:   (result: unknown) => void;
        onClose?:   () => void;
      }) => void;
    };
  }
}

interface Props {
  open:        boolean;
  onClose:     () => void;
  onPaid:      () => void;   // dipanggil setelah snap.onSuccess
  programId:   string;
  programNama: string;
  tarif:       number;
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) return void resolve();
    const existingScript = document.getElementById('midtrans-snap');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string;
    const isProd    = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    const src       = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const script = document.createElement('script');
    script.id  = 'midtrans-snap';
    script.src = src;
    if (clientKey) script.setAttribute('data-client-key', clientKey);
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.js'));
    document.head.appendChild(script);
  });
}

export function CheckoutDialog({ open, onClose, onPaid, programId, programNama, tarif }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleCheckout() {
    setIsProcessing(true);
    try {
      await loadSnapScript();

      const order: Order = await ordersApi.create(programId);
      if (!order.snap_token) throw new Error('Snap token tidak tersedia');

      if (!window.snap) throw new Error('Snap.js tidak berhasil dimuat');

      window.snap.pay(order.snap_token, {
        onSuccess: (_result) => {
          toast.success('Pembayaran berhasil! Enrollment Anda sedang diproses.');
          onPaid();
          onClose();
        },
        onPending: (_result) => {
          toast.info('Pembayaran sedang diproses. Enrollment akan aktif setelah konfirmasi.');
          onClose();
        },
        onError: (_result) => {
          toast.error('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          // Pengguna tutup popup tanpa bayar — order masih pending
          toast.info('Pembayaran belum selesai. Order Anda tersimpan selama 24 jam.');
          onClose();
        },
      });
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembelian</DialogTitle>
          <DialogDescription>
            Anda akan membeli program berikut.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="font-semibold">{programNama}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatRupiah(tarif)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Link pembayaran tersedia selama 24 jam. Refund dapat diajukan dalam 48 jam setelah pembayaran berhasil.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isProcessing}>
            Batal
          </Button>
          <Button className="flex-1" onClick={handleCheckout} disabled={isProcessing}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isProcessing ? 'Memuat...' : 'Bayar Sekarang'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
