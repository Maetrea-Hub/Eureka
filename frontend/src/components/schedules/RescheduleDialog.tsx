import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { schedulesApi, type Schedule } from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

const Schema = z.object({
  tanggal:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  jam_mulai:   z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid'),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid'),
}).refine((v) => v.jam_selesai > v.jam_mulai, {
  message: 'Jam selesai harus setelah jam mulai',
  path:    ['jam_selesai'],
});

type FormValues = z.infer<typeof Schema>;

const INPUT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface Props {
  schedule: Schedule | null;
  onClose:  () => void;
  onDone:   () => void;
}

export function RescheduleDialog({ schedule, onClose, onDone }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { tanggal: '', jam_mulai: '', jam_selesai: '' },
  });

  useEffect(() => {
    if (schedule) {
      form.reset({ tanggal: '', jam_mulai: schedule.jam_mulai, jam_selesai: schedule.jam_selesai });
      setErrorMsg(null);
    }
  }, [schedule, form]);

  async function onSubmit(values: FormValues) {
    if (!schedule) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await schedulesApi.reschedule(schedule.id, values);
      toast.success('Jadwal berhasil dijadwalkan ulang dengan Zoom meeting baru');
      onDone();
      handleClose();
    } catch (err) {
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() { setErrorMsg(null); onClose(); }

  return (
    <Dialog open={!!schedule} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Jadwalkan Ulang</DialogTitle>
          <DialogDescription>
            Jadwal lama akan ditandai "Dijadwalkan Ulang". Zoom meeting baru akan dibuat otomatis.
          </DialogDescription>
        </DialogHeader>

        {schedule && (
          <p className="text-sm text-muted-foreground -mt-1">
            Jadwal sebelumnya: <span className="font-medium">{schedule.tanggal}</span>{' '}
            {schedule.jam_mulai} – {schedule.jam_selesai}
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Baru</FormLabel>
                  <FormControl>
                    <input type="date" className={INPUT_CLASS} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jam_mulai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Mulai</FormLabel>
                    <FormControl>
                      <input type="time" className={INPUT_CLASS} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jam_selesai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Selesai</FormLabel>
                    <FormControl>
                      <input type="time" className={INPUT_CLASS} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {errorMsg && (
              <Alert variant="destructive" className="text-sm">{errorMsg}</Alert>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Memproses…' : 'Jadwalkan Ulang'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
