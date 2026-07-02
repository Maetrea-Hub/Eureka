import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/errors';
import {
  materialsApi, MAPEL_LIST, MAPEL_LABEL,
  type Material, type MaterialTipe,
} from '@/lib/materials-api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DokumenFields } from './DokumenFields';
import { VideoFields } from './VideoFields';
import { BankSoalManager } from './BankSoalManager';

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  judul:            z.string().min(2, 'Minimal 2 karakter').max(300),
  jenjang:          z.enum(['SD', 'SMP', 'SMA'] as const),
  mata_pelajaran:   z.enum(MAPEL_LIST as [string, ...string[]] as unknown as
    ['ipa_terpadu'|'matematika'|'b_inggris'|'biologi'|'fisika'|'kimia',
     ...('ipa_terpadu'|'matematika'|'b_inggris'|'biologi'|'fisika'|'kimia')[]]),
  topik:            z.string().min(1, 'Topik wajib diisi'),
  // dokumen
  file_url:         z.string().url('URL tidak valid').nullable().optional(),
  file_type:        z.enum(['pdf','ppt','docx','epub'] as const).nullable().optional(),
  bisa_download:    z.boolean().optional(),
  // video
  video_url:        z.string().url('URL tidak valid').nullable().optional(),
  duration_seconds: z.coerce.number().int().positive().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSaved:   () => void;
  tipe:      MaterialTipe;
  material?: Material;
}

export function MaterialFormSheet({ open, onClose, onSaved, tipe, material }: Props) {
  const isEdit = !!material;
  const [savedMaterialId, setSavedMaterialId] = useState<string | null>(
    material?.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<'info' | 'konten'>('info');

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      judul: '', jenjang: 'SMP', mata_pelajaran: 'matematika', topik: '',
      file_url: null, file_type: null, bisa_download: false,
      video_url: null, duration_seconds: null,
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        judul:            material.judul,
        jenjang:          material.jenjang,
        mata_pelajaran:   material.mata_pelajaran,
        topik:            material.topik,
        file_url:         material.file_url,
        file_type:        material.file_type,
        bisa_download:    material.bisa_download,
        video_url:        material.video_url,
        duration_seconds: material.duration_seconds,
      });
      setSavedMaterialId(material.id);
    } else {
      form.reset({
        judul: '', jenjang: 'SMP', mata_pelajaran: 'matematika', topik: '',
        file_url: null, file_type: null, bisa_download: false,
        video_url: null, duration_seconds: null,
      });
      setSavedMaterialId(null);
    }
    setActiveTab('info');
  }, [material, open, form]);

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        tipe,
        // Bersihkan kolom yang tidak relevan per tipe
        ...(tipe !== 'dokumen' && { file_url: null, file_type: null, bisa_download: false }),
        ...(tipe !== 'video'   && { video_url: null, duration_seconds: null }),
      };

      if (isEdit && material) {
        await materialsApi.update(material.id, payload);
        toast.success('Materi berhasil diperbarui');
        onSaved();
        onClose();
      } else {
        const created = await materialsApi.create(payload);
        toast.success(
          tipe === 'bank_soal'
            ? 'Materi dibuat. Tambahkan soal di tab Konten.'
            : 'Materi berhasil ditambahkan',
        );
        setSavedMaterialId(created.id);
        if (tipe === 'bank_soal') {
          setActiveTab('konten');
          onSaved(); // refresh list
        } else {
          onSaved();
          onClose();
        }
      }
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const tipeLabelMap: Record<MaterialTipe, string> = {
    dokumen: 'Dokumen', video: 'Video', bank_soal: 'Bank Soal',
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-4">
          <SheetTitle>
            {isEdit ? `Edit ${tipeLabelMap[tipe]}` : `Tambah ${tipeLabelMap[tipe]}`}
          </SheetTitle>
          <SheetDescription>
            {tipe === 'bank_soal' && !isEdit
              ? 'Simpan info dasar dulu, lalu tambahkan soal di tab Konten.'
              : 'Isi detail materi di bawah ini.'}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'konten')}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="info" className="flex-1">Info Dasar</TabsTrigger>
            {tipe === 'bank_soal' && (
              <TabsTrigger value="konten" className="flex-1" disabled={!savedMaterialId}>
                Soal {!savedMaterialId && '(simpan dulu)'}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Tab: Info Dasar ── */}
          <TabsContent value="info">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField control={form.control} name="judul" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Materi</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Persamaan Kuadrat - Pengantar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
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

                  <FormField control={form.control} name="mata_pelajaran" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata Pelajaran</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {MAPEL_LIST.map((m) => (
                            <SelectItem key={m} value={m}>{MAPEL_LABEL[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="topik" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topik</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Bab 3 - Fungsi Kuadrat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Type-specific fields */}
                {tipe === 'dokumen' && <DokumenFields control={form.control as any} />}
                {tipe === 'video'   && <VideoFields   control={form.control as any} />}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Materi')}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* ── Tab: Bank Soal ── */}
          {tipe === 'bank_soal' && savedMaterialId && (
            <TabsContent value="konten">
              <BankSoalManager
                materialId={savedMaterialId}
                initialQuestions={material?.questions ?? []}
              />
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => { onSaved(); onClose(); }}
              >
                Selesai
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
