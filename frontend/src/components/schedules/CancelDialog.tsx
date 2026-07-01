import { useState } from 'react';
import { toast } from 'sonner';
import { schedulesApi, type Schedule } from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

interface Props {
  schedule: Schedule | null;
  onClose:  () => void;
  onDone:   () => void;
}

export function CancelDialog({ schedule, onClose, onDone }: Props) {
  const [reason,   setReason]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    if (!schedule) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await schedulesApi.cancel(schedule.id, reason.trim() || undefined);
      toast.success(`Jadwal "${schedule.judul_kelas}" dibatalkan`);
      onDone();
      handleClose();
    } catch (err) {
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setReason('');
    setErrorMsg(null);
    onClose();
  }

  return (
    <AlertDialog open={!!schedule} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Jadwal</AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan membatalkan jadwal{' '}
            <span className="font-semibold">"{schedule?.judul_kelas}"</span> pada{' '}
            {schedule?.tanggal} pukul {schedule?.jam_mulai}.
            Zoom meeting akan dihapus otomatis.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Alasan pembatalan (opsional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Tulis alasan pembatalan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="text-sm">{errorMsg}</Alert>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Memproses…' : 'Ya, Batalkan Jadwal'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
