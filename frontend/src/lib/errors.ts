import axios from 'axios';

export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data?.error === 'string') return data.error;
    if (data?.error?.formErrors?.[0]) return data.error.formErrors[0];
    const fieldErrors = data?.error?.fieldErrors as Record<string, string[]> | undefined;
    if (fieldErrors) {
      const first = Object.values(fieldErrors)[0];
      if (first?.[0]) return first[0];
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Terjadi kesalahan, coba lagi';
}

// Normalizes Indonesian phone number to 628xxx format
// Supports: 08xxx, +628xxx, 628xxx, 8xxx
export function normalizeWA(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  if (digits.length > 0) return '62' + digits;
  return digits;
}
