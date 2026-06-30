import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { extractApiError, normalizeWA } from '@/lib/errors';
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
  nama_lengkap:    z.string().min(2, 'Minimal 2 karakter').max(100),
  email:           z.string().email('Email tidak valid'),
  nomor_whatsapp:  z.string().min(1, 'Nomor WhatsApp wajib diisi'),
  jenjang_sekolah: z.enum(['SD', 'SMP', 'SMA'] as const),
  password:        z.string().min(8, 'Minimal 8 karakter').max(72),
  confirm_password: z.string(),
})
  .refine((d) => d.password === d.confirm_password, {
    message: 'Password tidak cocok',
    path: ['confirm_password'],
  })
  .refine((d) => waRegex.test(normalizeWA(d.nomor_whatsapp)), {
    message: 'Format salah (contoh: 081234567890)',
    path: ['nomor_whatsapp'],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama_lengkap: '',
      email: '',
      nomor_whatsapp: '',
      jenjang_sekolah: 'SMP',
      password: '',
      confirm_password: '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      await api.post('/api/auth/register', {
        nama_lengkap:    data.nama_lengkap,
        email:           data.email,
        nomor_whatsapp:  normalizeWA(data.nomor_whatsapp),
        jenjang_sekolah: data.jenjang_sekolah,
        password:        data.password,
      });
      setDone(true);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold">Cek email Anda!</p>
        <p className="text-sm text-muted-foreground">
          Kami mengirim link verifikasi ke email Anda. Klik link tersebut untuk mengaktifkan akun.
        </p>
        <Button variant="link" className="h-auto p-0" onClick={() => navigate('/login')}>
          Kembali ke halaman login
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nama_lengkap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama sesuai KTP/KK" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contoh@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nomor_whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor WhatsApp</FormLabel>
              <FormControl>
                <Input placeholder="08123456789 atau 6281234..." {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Minimal 8 karakter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Ketik ulang password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </Button>
      </form>
    </Form>
  );
}
