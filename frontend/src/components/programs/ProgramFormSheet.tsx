import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/errors';
import {
  programsApi, MATA_PELAJARAN_LIST,
  type Program, type ProgramInput,
} from '@/lib/programs-api';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MataPelajaranField } from './MataPelajaranField';

// ── Zod schema (Zod v4, sesuai versi frontend) ───────────────

const MAPEL_VALUES = MATA_PELAJARAN_LIST;

const schema = z.object({
  nama:           z.string().min(2, 'Minimal 2 karakter').max(200),
  tipe_layanan:   z.enum(['private', 'small_class', 'regular_class'] as const),
  jenjang:        z.enum(['SD', 'SMP', 'SMA'] as const),
  mata_pelajaran: z.array(z.enum(MAPEL_VALUES as [string, ...string[]] as unknown as [
    'ipa_terpadu' | 'matematika' | 'b_inggris' | 'biologi' | 'fisika' | 'kimia',
    ...('ipa_terpadu' | 'matematika' | 'b_inggris' | 'biologi' | 'fisika' | 'kimia')[],
  ])).min(1, 'Pilih minimal 1 mata pelajaran'),
  durasi:         z.string().min(1, 'Durasi wajib diisi'),
  kapasitas:      z.coerce.number().int('Harus bilangan bulat').min(1, 'Minimal 1'),
  tarif:          z.coerce.number().min(0, 'Tarif tidak boleh negatif'),
  status:         z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open:     boolean;
  onClose:  () => void;
  onSaved:  () => void;
  program?: Program; // undefined = create mode
}

export function ProgramFormSheet({ open, onClose, onSaved, program }: Props) {
  const isEdit = !!program;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama:           '',
      tipe_layanan:   'regular_class',
      jenjang:        'SMP',
      mata_pelajaran: [],
      durasi:         '',
      kapasitas:      1,
      tarif:          0,
      status:         true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (program) {
      form.reset({
        nama:           program.nama,
        tipe_layanan:   program.tipe_layanan,
        jenjang:        program.jenjang,
        mata_pelajaran: program.mata_pelajaran,
        durasi:         program.durasi,
        kapasitas:      program.kapasitas,
        tarif:          program.tarif,
        status:         program.status,
      });
    } else {
      form.reset({
        nama: '', tipe_layanan: 'regular_class', jenjang: 'SMP',
        mata_pelajaran: [], durasi: '', kapasitas: 1, tarif: 0, status: true,
      });
    }
  }, [program, form, open]);

  async function onSubmit(data: FormData) {
    const input = data as ProgramInput;
    try {
      if (isEdit && program) {
        await programsApi.update(program.id, input);
        toast.success('Program berhasil diperbarui');
      } else {
        await programsApi.create(input);
        toast.success('Program berhasil ditambahkan');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEdit ? `Edit: ${program?.nama}` : 'Tambah Program Baru'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Perubahan kapasitas diblokir jika program sedang aktif digunakan.'
              : 'Isi semua field wajib untuk membuat pilihan program baru.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Program</FormLabel>
                <FormControl><Input placeholder="Contoh: Bimbel Intensif SMA IPA" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="tipe_layanan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Layanan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="small_class">Small Class</SelectItem>
                      <SelectItem value="regular_class">Regular Class</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="jenjang" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenjang</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SD">SD</SelectItem>
                      <SelectItem value="SMP">SMP</SelectItem>
                      <SelectItem value="SMA">SMA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="mata_pelajaran" render={({ field }) => (
              <MataPelajaranField field={field} />
            )} />

            <FormField control={form.control} name="durasi" render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi</FormLabel>
                <FormControl><Input placeholder="Contoh: 1 Bulan, 3 Bulan" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="kapasitas" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapasitas (siswa)</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tarif" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarif (Rp)</FormLabel>
                  <FormControl><Input type="number" min={0} step={1000} placeholder="500000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel className="text-base">Status Aktif</FormLabel>
                  <p className="text-sm text-muted-foreground">Program tampil dan bisa didaftarkan siswa</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? (isEdit ? 'Menyimpan...' : 'Membuat...')
                  : (isEdit ? 'Simpan Perubahan' : 'Buat Program')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
