import { useState } from 'react';
import { toast } from 'sonner';
import { materialsApi, type Material } from '@/lib/materials-api';
import { extractApiError } from '@/lib/errors';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  material:  Material | null;
  onClose:   () => void;
  onDeleted: () => void;
}

export function MaterialDeleteDialog({ material, onClose, onDeleted }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDelete() {
    if (!material) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await materialsApi.delete(material.id);
      toast.success(`Materi "${material.judul}" dihapus`);
      onDeleted();
      onClose();
    } catch (err) {
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() { setErrorMsg(null); onClose(); }

  return (
    <Dialog open={!!material} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Materi</DialogTitle>
          <DialogDescription>
            Anda akan menghapus materi{' '}
            <span className="font-semibold">"{material?.judul}"</span>.
            Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="text-sm">
            {errorMsg}
            {errorMsg.includes('sudah pernah diakses') && (
              <p className="mt-1 font-medium">
                Gunakan opsi ubah status ke "Nonaktif" untuk menyembunyikan materi.
              </p>
            )}
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
