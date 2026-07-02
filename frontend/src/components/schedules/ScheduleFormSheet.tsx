import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { schedulesApi, type Schedule } from '@/lib/schedules-api';
import { programsApi } from '@/lib/programs-api';
import { extractApiError } from '@/lib/errors';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

const Schema = z.object({
  program_id:  z.string().uuid({ message: 'Pilih program terlebih dahulu' }),
  judul_kelas: z.string().min(3, 'Minimal 3 karakter').max(200),
  tanggal:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  jam_mulai:   z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid'),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid'),
}).refine((v) => v.jam_selesai > v.jam_mulai, {
  message: 'Jam selesai harus setelah jam mulai',
  path:    ['jam_selesai'],
});

type FormValues = z.infer<typeof Schema>;

interface Program { id: string; nama: string; tipe_layanan: string; }

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSaved:   () => void;
  schedule?: Schedule;
}

const INPUT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function ScheduleFormSheet({ open, onClose, onSaved, schedule }: Props) {
  const isEdit = !!schedule;

  const [programs,  setPrograms]  = useState<Program[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [zoomNote,  setZoomNote]  = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as any,
    defaultValues: {
      program_id:  schedule?.program_id  ?? '',
      judul_kelas: schedule?.judul_kelas ?? '',
      tanggal:     schedule?.tanggal     ?? '',
      jam_mulai:   schedule?.jam_mulai   ?? '',
      jam_selesai: schedule?.jam_selesai ?? '',
    },
  });

  // Fetch programs list for dropdown
  useEffect(() => {
    if (!open) return;
    programsApi.getAll().then((list) => setPrograms(list.filter((p) => p.status)));
  }, [open]);

  // Reset form when schedule changes
  useEffect(() => {
    if (open) {
      form.reset({
        program_id:  schedule?.program_id  ?? '',
        judul_kelas: schedule?.judul_kelas ?? '',
        tanggal:     schedule?.tanggal     ?? '',
        jam_mulai:   schedule?.jam_mulai   ?? '',
        jam_selesai: schedule?.jam_selesai ?? '',
      });
      setErrorMsg(null);
      setZoomNote(null);
    }
  }, [open, schedule, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setErrorMsg(null);
    setZoomNote('Membuat Zoom meeting…');
    try {
      if (isEdit) {
        await schedulesApi.update(schedule!.id, values);
        toast.success('Jadwal berhasil diperbarui');
      } else {
        await schedulesApi.create(values);
        toast.success('Jadwal dibuat dan Zoom meeting otomatis terbuat');
      }
      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
      setZoomNote(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Kelas'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Perubahan waktu/tanggal akan otomatis diupdate di Zoom'
              : 'Zoom meeting akan dibuat otomatis setelah form disimpan'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">

            {/* Program */}
            <FormField
              control={form.control}
              name="program_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih program..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Judul Kelas */}
            <FormField
              control={form.control}
              name="judul_kelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="contoh: Fisika — Hukum Newton" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tanggal */}
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <input type="date" className={INPUT_CLASS} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jam Mulai & Selesai */}
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

            {zoomNote && (
              <p className="text-sm text-muted-foreground">{zoomNote}</p>
            )}
            {errorMsg && (
              <Alert variant="destructive" className="text-sm">{errorMsg}</Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Jadwal'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
