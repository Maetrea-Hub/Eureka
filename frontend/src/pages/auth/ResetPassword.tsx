import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  password:         z.string().min(8, 'Minimal 8 karakter').max(72),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Password tidak cocok',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { password: '', confirm_password: '' },
  });

  useEffect(() => {
    // Supabase processes the recovery hash from the URL automatically
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    // Check if session already established (e.g. page reload)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // Give Supabase 1s to process the hash before showing invalid
        setTimeout(() => setInvalid(true), 1000);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Password berhasil diubah!');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  if (!ready && invalid) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-semibold text-destructive">Link tidak valid</p>
        <p className="text-sm text-muted-foreground">
          Link reset password sudah kadaluarsa atau tidak valid. Minta link baru.
        </p>
        <Button variant="link" className="h-auto p-0" onClick={() => navigate('/forgot-password')}>
          Minta link reset baru
        </Button>
      </div>
    );
  }

  if (!ready) {
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password Baru</FormLabel>
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
                <Input type="password" placeholder="Ketik ulang password baru" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Buat Password Baru"
      subtitle="Masukkan password baru untuk akun Anda"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
