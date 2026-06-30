import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { extractApiError } from '@/lib/errors';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  InputOTP, InputOTPGroup, InputOTPSlot,
} from '@/components/ui/input-otp';

// ── Step 1: credentials ──────────────────────────────────────

const step1Schema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type Step1Data = z.infer<typeof step1Schema>;

// ── Step 2: OTP ──────────────────────────────────────────────

const step2Schema = z.object({
  otp: z.string().length(6, 'OTP harus tepat 6 digit'),
});

type Step2Data = z.infer<typeof step2Schema>;

// ── Types returned by backend ────────────────────────────────

interface Step1Response {
  temp_token: string;
  wa_preview: string; // last 4 digits of WA
}

interface Step2Response {
  access_token:  string;
  refresh_token: string;
  user: { id: string };
}

// ── Component ────────────────────────────────────────────────

export function LoginAdminForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [tempToken, setTempToken] = useState('');
  const [waPreview, setWaPreview] = useState('');

  // ── Step 1 form ────────────────────────────────────────────

  const step1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '', password: '' },
  });

  async function onStep1Submit(data: Step1Data) {
    try {
      const res = await api.post<Step1Response>('/api/auth/admin/login', data);
      setTempToken(res.data.temp_token);
      setWaPreview(res.data.wa_preview);
      setStep(2);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  // ── Step 2 form ────────────────────────────────────────────

  const step2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { otp: '' },
  });

  async function onStep2Submit(data: Step2Data) {
    try {
      const res = await api.post<Step2Response>('/api/auth/admin/verify-otp', {
        temp_token: tempToken,
        otp: data.otp,
      });

      const { error } = await supabase.auth.setSession({
        access_token:  res.data.access_token,
        refresh_token: res.data.refresh_token,
      });

      if (error) {
        toast.error('Gagal menetapkan sesi: ' + error.message);
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = extractApiError(err);
      toast.error(msg);
      // reset OTP field on failure
      step2.reset();
    }
  }

  // ── Render Step 1 ─────────────────────────────────────────

  if (step === 1) {
    return (
      <Form {...step1}>
        <form onSubmit={step1.handleSubmit(onStep1Submit)} className="space-y-4">
          <FormField
            control={step1.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Admin</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="admin@eureka.id" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={step1.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={step1.formState.isSubmitting}>
            {step1.formState.isSubmitting ? 'Memverifikasi...' : 'Lanjut'}
          </Button>
        </form>
      </Form>
    );
  }

  // ── Render Step 2 ─────────────────────────────────────────

  return (
    <Form {...step2}>
      <form onSubmit={step2.handleSubmit(onStep2Submit)} className="space-y-6">
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          Kode OTP 6 digit telah dikirim ke WhatsApp Anda
          {waPreview && (
            <span className="ml-1 font-medium text-foreground">
              (***{waPreview})
            </span>
          )}
          . Berlaku 5 menit.
        </div>

        <FormField
          control={step2.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center space-y-3">
              <FormLabel>Kode OTP</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full"
            disabled={step2.formState.isSubmitting || step2.watch('otp').length < 6}
          >
            {step2.formState.isSubmitting ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => { setStep(1); step2.reset(); }}
          >
            Kembali
          </Button>
        </div>
      </form>
    </Form>
  );
}
