import { useState } from 'react';
import { toast } from 'sonner';
import { programsApi, type Program } from '@/lib/programs-api';
import { extractApiError } from '@/lib/errors';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface Props {
  program:  Program | null; // null = dialog tutup
  onClose:  () => void;
  onDeleted: () => void;
}

export function DeleteDialog({ program, onClose, onDeleted }: Props) {
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  async function handleDelete() {
    if (!program) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await programsApi.delete(program.id);
      toast.success(`Program "${program.nama}" berhasil dihapus`);
      onDeleted();
      onClose();
    } catch (err) {
      const msg = extractApiError(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setErrorMsg(null);
    onClose();
  }

  return (
    <Dialog open={!!program} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Program</DialogTitle>
          <DialogDescription>
            Anda akan menghapus program{' '}
            <span className="font-semibold">"{program?.nama}"</span>.
            Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="text-sm">
            {errorMsg}
            {errorMsg.includes('sedang aktif') && (
              <p className="mt-1 font-medium">
                Gunakan toggle status di tabel untuk menonaktifkan program terlebih dahulu.
              </p>
            )}
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
