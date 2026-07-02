import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { extractApiError, normalizeWA } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const waRegex = /^628\d{8,11}$/;

const schema = z.object({
  nomor_whatsapp:  z.string().min(1, 'Nomor WhatsApp wajib diisi'),
  jenjang_sekolah: z.enum(['SD', 'SMP', 'SMA'] as const),
  foto_url:        z.string().url('URL tidak valid').optional().or(z.literal('')),
})
  .refine((d) => waRegex.test(normalizeWA(d.nomor_whatsapp)), {
    message: 'Format salah (contoh: 081234567890)',
    path: ['nomor_whatsapp'],
  });

type FormData = z.infer<typeof schema>;

export function OnboardingForm() {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nomor_whatsapp:  '',
      jenjang_sekolah: 'SMP',
      foto_url:        '',
    },
  });

  // Pre-fill from existing profile once loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        nomor_whatsapp:  profile.nomor_whatsapp ?? '',
        jenjang_sekolah: profile.jenjang_sekolah ?? 'SMP',
        foto_url:        profile.foto_url ?? '',
      });
    }
  }, [profile, form]);

  async function onSubmit(data: FormData) {
    try {
      const payload: Record<string, string> = {
        nomor_whatsapp:  normalizeWA(data.nomor_whatsapp),
        jenjang_sekolah: data.jenjang_sekolah,
      };
      if (data.foto_url) payload.foto_url = data.foto_url;

      await api.post('/api/auth/onboarding', payload);
      toast.success('Profil berhasil disimpan!');
      navigate('/siswa', { replace: true });
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nomor_whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor WhatsApp</FormLabel>
              <FormControl>
                <Input placeholder="08123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jenjang_sekolah"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenjang Sekolah</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SD">SD</SelectItem>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="SMA">SMA</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="foto_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Foto Profil{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Menyimpan...' : 'Mulai Belajar'}
        </Button>
      </form>
    </Form>
  );
}
