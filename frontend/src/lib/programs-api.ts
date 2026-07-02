import { api } from './api';

export type TipeLayanan  = 'private' | 'small_class' | 'regular_class';
export type JenjangLevel = 'SD' | 'SMP' | 'SMA';
export type MataPelajaran =
  | 'ipa_terpadu' | 'matematika' | 'b_inggris'
  | 'biologi'     | 'fisika'     | 'kimia';

export const MATA_PELAJARAN_LIST: MataPelajaran[] = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
];

export const MAPEL_LABEL: Record<MataPelajaran, string> = {
  ipa_terpadu: 'IPA Terpadu',
  matematika:  'Matematika',
  b_inggris:   'B. Inggris',
  biologi:     'Biologi',
  fisika:      'Fisika',
  kimia:       'Kimia',
};

export const TIPE_LABEL: Record<TipeLayanan, string> = {
  private:       'Private',
  small_class:   'Small Class',
  regular_class: 'Regular Class',
};

export interface Program {
  id:             string;
  nama:           string;
  tipe_layanan:   TipeLayanan;
  jenjang:        JenjangLevel;
  mata_pelajaran: MataPelajaran[];
  durasi:         string;
  durasi_hari:    number | null;
  kapasitas:      number;
  tarif:          number;
  status:         boolean;
  created_at:     string;
  updated_at:     string;
}

export type ProgramInput = Omit<Program, 'id' | 'created_at' | 'updated_at'>;

export interface ProgramFilters {
  jenjang?:      JenjangLevel;
  tipe_layanan?: TipeLayanan;
  status?:       boolean;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export const programsApi = {
  getAll: (filters?: ProgramFilters) => {
    const params = new URLSearchParams();
    if (filters?.jenjang)      params.set('jenjang', filters.jenjang);
    if (filters?.tipe_layanan) params.set('tipe',    filters.tipe_layanan);
    if (filters?.status !== undefined) params.set('status', String(filters.status));
    return api.get<Program[]>(`/api/programs?${params}`).then((r) => r.data);
  },

  getById: (id: string) =>
    api.get<Program>(`/api/programs/${id}`).then((r) => r.data),

  create: (input: ProgramInput) =>
    api.post<Program>('/api/programs', input).then((r) => r.data),

  update: (id: string, input: Partial<ProgramInput>) =>
    api.put<Program>(`/api/programs/${id}`, input).then((r) => r.data),

  toggleStatus: (id: string, status: boolean) =>
    api.patch<Program>(`/api/programs/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/programs/${id}`),
};
