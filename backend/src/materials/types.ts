export type MaterialTipe   = 'dokumen' | 'video' | 'bank_soal';
export type MaterialStatus = 'draft' | 'published' | 'nonaktif';
export type FileType       = 'pdf' | 'ppt' | 'docx' | 'epub';
export type TipeSoal       = 'pilihan_ganda' | 'essay';
export type JenjangLevel   = 'SD' | 'SMP' | 'SMA';
export type MataPelajaran  =
  | 'ipa_terpadu' | 'matematika' | 'b_inggris'
  | 'biologi'     | 'fisika'     | 'kimia';

export const MAPEL_VALID: MataPelajaran[] = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
];

export interface OpsiJawaban {
  text:       string;
  is_correct: boolean;
}

export interface Question {
  id:                  string;
  material_id:         string;
  pertanyaan:          string;
  tipe_soal:           TipeSoal;
  opsi_jawaban:        OpsiJawaban[] | null;
  pembahasan:          string | null;
  ada_timer:           boolean;
  durasi_timer_detik:  number | null;
  urutan:              number;
  created_at:          string;
}

export interface Material {
  id:               string;
  judul:            string;
  jenjang:          JenjangLevel;
  mata_pelajaran:   MataPelajaran;
  topik:            string;
  tipe:             MaterialTipe;
  tutor_id:         string;
  status:           MaterialStatus;
  // dokumen
  file_url:         string | null;
  file_type:        FileType | null;
  bisa_download:    boolean;
  // video
  video_url:        string | null;
  duration_seconds: number | null;
  created_at:       string;
  updated_at:       string;
  // joined (optional, saat GET by id untuk bank_soal)
  questions?:       Question[];
}

export interface MaterialInput {
  judul:            string;
  jenjang:          JenjangLevel;
  mata_pelajaran:   MataPelajaran;
  topik:            string;
  tipe:             MaterialTipe;
  tutor_id:         string;
  status?:          MaterialStatus;
  file_url?:        string | null;
  file_type?:       FileType | null;
  bisa_download?:   boolean;
  video_url?:       string | null;
  duration_seconds?: number | null;
}

export interface QuestionInput {
  pertanyaan:         string;
  tipe_soal:          TipeSoal;
  opsi_jawaban?:      OpsiJawaban[] | null;
  pembahasan?:        string | null;
  ada_timer?:         boolean;
  durasi_timer_detik?: number | null;
  urutan?:            number;
}

export interface MaterialFilters {
  jenjang?:        JenjangLevel;
  mata_pelajaran?: MataPelajaran;
  topik?:          string;
  tipe?:           MaterialTipe;
  status?:         MaterialStatus;
  tutor_id?:       string;
}
