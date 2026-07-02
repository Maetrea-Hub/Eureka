export type TipeLayanan  = 'private' | 'small_class' | 'regular_class';
export type JenjangLevel = 'SD' | 'SMP' | 'SMA';
export type MataPelajaran =
  | 'ipa_terpadu'
  | 'matematika'
  | 'b_inggris'
  | 'biologi'
  | 'fisika'
  | 'kimia';

export const MATA_PELAJARAN_LIST: MataPelajaran[] = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
];

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

export interface ProgramInput {
  nama:           string;
  tipe_layanan:   TipeLayanan;
  jenjang:        JenjangLevel;
  mata_pelajaran: MataPelajaran[];
  durasi:         string;
  durasi_hari?:   number | null;
  kapasitas:      number;
  tarif:          number;
  status:         boolean;
}
