import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { materialsApi, type Question, type OpsiJawaban } from '@/lib/materials-api';
import { extractApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ── Zod schema ────────────────────────────────────────────────

const OpsiSchema = z.object({
  text:       z.string().min(1, 'Teks opsi wajib diisi'),
  is_correct: z.boolean(),
});

const QuestionFormSchema = z.discriminatedUnion('tipe_soal', [
  z.object({
    tipe_soal:          z.literal('pilihan_ganda'),
    pertanyaan:         z.string().min(1, 'Pertanyaan wajib diisi'),
    opsi_jawaban:       z.array(OpsiSchema).min(2, 'Minimal 2 opsi'),
    jawaban_benar_idx:  z.number({ required_error: 'Pilih 1 jawaban benar' }),
    pembahasan:         z.string().nullable().optional(),
    ada_timer:          z.boolean(),
    durasi_timer_detik: z.coerce.number().int().positive().nullable().optional(),
  }),
  z.object({
    tipe_soal:          z.literal('essay'),
    pertanyaan:         z.string().min(1, 'Pertanyaan wajib diisi'),
    opsi_jawaban:       z.null().optional(),
    jawaban_benar_idx:  z.number().optional(),
    pembahasan:         z.string().nullable().optional(),
    ada_timer:          z.boolean(),
    durasi_timer_detik: z.coerce.number().int().positive().nullable().optional(),
  }),
]);

type QuestionFormData = z.infer<typeof QuestionFormSchema>;

// ── Sub-component: single question form ──────────────────────

interface QuestionFormProps {
  materialId: string;
  question?:  Question;         // undefined = create mode
  nextUrutan: number;
  onSaved:    (q: Question) => void;
  onCancel:   () => void;
}

function QuestionForm({ materialId, question, nextUrutan, onSaved, onCancel }: QuestionFormProps) {
  const isEdit = !!question;

  // Build default opsi_jawaban with jawaban_benar_idx tracking
  const defaultOpsi: OpsiJawaban[] = question?.opsi_jawaban ?? [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ];
  const defaultBenarIdx = defaultOpsi.findIndex((o) => o.is_correct);

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      tipe_soal:          question?.tipe_soal ?? 'pilihan_ganda',
      pertanyaan:         question?.pertanyaan ?? '',
      opsi_jawaban:       defaultOpsi,
      jawaban_benar_idx:  defaultBenarIdx >= 0 ? defaultBenarIdx : undefined,
      pembahasan:         question?.pembahasan ?? '',
      ada_timer:          question?.ada_timer ?? false,
      durasi_timer_detik: question?.durasi_timer_detik ?? null,
    } as QuestionFormData,
  });

  const tipeSoal = form.watch('tipe_soal');
  const adaTimer = form.watch('ada_timer');

  const { fields: opsiFields, append: appendOpsi, remove: removeOpsi } =
    useFieldArray({ control: form.control, name: 'opsi_jawaban' as never });

  async function onSubmit(data: QuestionFormData) {
    // Rebuild opsi_jawaban with correct is_correct flags
    let opsi: OpsiJawaban[] | null = null;
    if (data.tipe_soal === 'pilihan_ganda' && data.opsi_jawaban) {
      opsi = (data.opsi_jawaban as OpsiJawaban[]).map((o, i) => ({
        text:       o.text,
        is_correct: i === (data as { jawaban_benar_idx?: number }).jawaban_benar_idx,
      }));
    }

    const payload = {
      pertanyaan:         data.pertanyaan,
      tipe_soal:          data.tipe_soal,
      opsi_jawaban:       opsi,
      pembahasan:         data.pembahasan || null,
      ada_timer:          data.ada_timer,
      durasi_timer_detik: data.ada_timer ? (data.durasi_timer_detik ?? null) : null,
      urutan:             question?.urutan ?? nextUrutan,
    };

    try {
      const saved = isEdit
        ? await materialsApi.updateQuestion(materialId, question!.id, payload)
        : await materialsApi.addQuestion(materialId, payload);
      toast.success(isEdit ? 'Soal diperbarui' : 'Soal ditambahkan');
      onSaved(saved);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4">
        {/* Tipe Soal */}
        <FormField control={form.control} name="tipe_soal" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipe Soal</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pilihan_ganda" id="pg" />
                  <Label htmlFor="pg">Pilihan Ganda</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="essay" id="es" />
                  <Label htmlFor="es">Essay</Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )} />

        {/* Pertanyaan */}
        <FormField control={form.control} name="pertanyaan" render={({ field }) => (
          <FormItem>
            <FormLabel>Pertanyaan</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tulis pertanyaan di sini..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Opsi Jawaban (hanya pilihan ganda) */}
        {tipeSoal === 'pilihan_ganda' && (
          <div className="space-y-2">
            <FormLabel>Opsi Jawaban</FormLabel>
            <p className="text-xs text-muted-foreground">
              Klik <CheckCircle2 className="inline h-3 w-3" /> untuk menandai jawaban benar
            </p>

            <FormField control={form.control} name="jawaban_benar_idx" render={({ field: benarField }) => (
              <div className="space-y-2">
                {opsiFields.map((opsi, idx) => (
                  <div key={opsi.id} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />

                    <button
                      type="button"
                      onClick={() => benarField.onChange(idx)}
                      className="flex-shrink-0"
                      title="Tandai sebagai jawaban benar"
                    >
                      <CheckCircle2
                        className={`h-5 w-5 transition-colors ${
                          benarField.value === idx
                            ? 'text-primary'
                            : 'text-muted-foreground/30 hover:text-muted-foreground'
                        }`}
                      />
                    </button>

                    <FormField
                      control={form.control}
                      name={`opsi_jawaban.${idx}.text` as never}
                      render={({ field }) => (
                        <Input
                          placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                          className="flex-1"
                          {...field}
                        />
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (opsiFields.length <= 2) return;
                        removeOpsi(idx);
                        if (benarField.value === idx) benarField.onChange(undefined);
                        else if (benarField.value !== undefined && benarField.value > idx) {
                          benarField.onChange(benarField.value - 1);
                        }
                      }}
                      disabled={opsiFields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <FormMessage />
              </div>
            )} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendOpsi({ text: '', is_correct: false } as never)}
              disabled={opsiFields.length >= 6}
            >
              <Plus className="mr-1 h-3 w-3" />
              Tambah Opsi
            </Button>
          </div>
        )}

        {/* Pembahasan */}
        <FormField control={form.control} name="pembahasan" render={({ field }) => (
          <FormItem>
            <FormLabel>Pembahasan <span className="font-normal text-muted-foreground">(opsional)</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Penjelasan jawaban yang tampil setelah siswa submit..."
                className="min-h-[60px]"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
          </FormItem>
        )} />

        {/* Timer */}
        <div className="space-y-2">
          <FormField control={form.control} name="ada_timer" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel className="text-sm">Aktifkan Timer</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />

          {adaTimer && (
            <FormField control={form.control} name="durasi_timer_detik" render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi Timer (detik)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={10}
                    placeholder="60"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Tambah Soal')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── Main component ────────────────────────────────────────────

interface Props {
  materialId:   string;
  initialQuestions?: Question[];
}

export function BankSoalManager({ materialId, initialQuestions = [] }: Props) {
  const [questions, setQuestions]     = useState<Question[]>(initialQuestions);
  const [addingNew, setAddingNew]     = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  // Sync jika initialQuestions berubah (saat material di-load ulang)
  useEffect(() => { setQuestions(initialQuestions); }, [initialQuestions]);

  function handleSaved(q: Question) {
    setQuestions((prev) => {
      const idx = prev.findIndex((p) => p.id === q.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = q; return next; }
      return [...prev, q];
    });
    setAddingNew(false);
    setEditingId(null);
  }

  async function handleDelete(qid: string) {
    setDeletingId(qid);
    try {
      await materialsApi.deleteQuestion(materialId, qid);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
      toast.success('Soal dihapus');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Bank Soal</p>
          <p className="text-xs text-muted-foreground">{questions.length} soal</p>
        </div>
        {!addingNew && (
          <Button size="sm" variant="outline" onClick={() => setAddingNew(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Tambah Soal
          </Button>
        )}
      </div>

      {/* Existing questions */}
      {questions.map((q, idx) => (
        <div key={q.id}>
          {editingId === q.id ? (
            <QuestionForm
              materialId={materialId}
              question={q}
              nextUrutan={questions.length + 1}
              onSaved={handleSaved}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Soal {idx + 1} ·{' '}
                    {q.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
                    {q.ada_timer && ` · Timer ${q.durasi_timer_detik}s`}
                  </p>
                  <p className="text-sm font-medium leading-snug">{q.pertanyaan}</p>

                  {q.opsi_jawaban && (
                    <div className="mt-2 space-y-1">
                      {q.opsi_jawaban.map((o, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${
                          o.is_correct ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                        }`}>
                          <span className="flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                          <span>{o.text}</span>
                          {o.is_correct && <CheckCircle2 className="ml-auto h-3 w-3 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.pembahasan && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Pembahasan:</span> {q.pembahasan}
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setEditingId(q.id)}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={deletingId === q.id}
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          {idx < questions.length - 1 && <Separator className="my-2" />}
        </div>
      ))}

      {/* Add new question form */}
      {addingNew && (
        <QuestionForm
          materialId={materialId}
          nextUrutan={questions.length + 1}
          onSaved={handleSaved}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {questions.length === 0 && !addingNew && (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada soal. Klik "Tambah Soal" untuk mulai.</p>
        </div>
      )}
    </div>
  );
}
