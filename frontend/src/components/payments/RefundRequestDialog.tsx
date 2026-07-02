import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { refundsApi, formatRupiah } from '@/lib/payments-api';
import { extractApiError } from '@/lib/errors';

interface Props {
  open:        boolean;
  onClose:     () => void;
  onSubmitted: () => void;
  orderId:     string;
  programNama: string;
  nominal:     number;
}

export function RefundRequestDialog({
  open, onClose, onSubmitted, orderId, programNama, nominal,
}: Props) {
  const [alasan,      setAlasan]      = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!alasan.trim() || alasan.trim().length < 10) {
      toast.error('Alasan refund minimal 10 karakter');
      return;
    }
    setIsSubmitting(true);
    try {
      await refundsApi.request(orderId, alasan.trim());
      toast.success('Pengajuan refund berhasil dikirim. Admin akan memproses dalam 1-3 hari kerja.');
      setAlasan('');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setAlasan(''); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Refund</DialogTitle>
          <DialogDescription>
            Refund hanya dapat diajukan dalam 48 jam sejak tanggal pembayaran.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{programNama}</p>
          <p className="mt-0.5 text-muted-foreground">{formatRupiah(nominal)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="alasan-refund">Alasan Refund</Label>
          <Textarea
            id="alasan-refund"
            placeholder="Jelaskan alasan pengajuan refund Anda..."
            rows={4}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            maxLength={500}
          />
          <p className="text-right text-xs text-muted-foreground">{alasan.length}/500</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting || !alasan.trim()}
          >
            {isSubmitting ? 'Mengirim...' : 'Ajukan Refund'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
