import { api } from './api';

export type MaterialTipe   = 'dokumen' | 'video' | 'bank_soal';
export type MaterialStatus = 'draft' | 'published' | 'nonaktif';
export type FileType       = 'pdf' | 'ppt' | 'docx' | 'epub';
export type TipeSoal       = 'pilihan_ganda' | 'essay';
export type JenjangLevel   = 'SD' | 'SMP' | 'SMA';
export type MataPelajaran  =
  | 'ipa_terpadu' | 'matematika' | 'b_inggris'
  | 'biologi'     | 'fisika'     | 'kimia';

export const MAPEL_LABEL: Record<MataPelajaran, string> = {
  ipa_terpadu: 'IPA Terpadu', matematika: 'Matematika', b_inggris: 'B. Inggris',
  biologi: 'Biologi', fisika: 'Fisika', kimia: 'Kimia',
};

export const MAPEL_LIST: MataPelajaran[] = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
];

export const TIPE_LABEL: Record<MaterialTipe, string> = {
  dokumen: 'Dokumen', video: 'Video', bank_soal: 'Bank Soal',
};

export const STATUS_LABEL: Record<MaterialStatus, string> = {
  draft: 'Draft', published: 'Published', nonaktif: 'Nonaktif',
};

export const FILE_TYPE_LABEL: Record<FileType, string> = {
  pdf: 'PDF', ppt: 'PowerPoint', docx: 'Word', epub: 'ePub',
};

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
  file_url:         string | null;
  file_type:        FileType | null;
  bisa_download:    boolean;
  video_url:        string | null;
  duration_seconds: number | null;
  created_at:       string;
  updated_at:       string;
  questions?:       Question[];
}

export type MaterialInput = Omit<Material, 'id' | 'tutor_id' | 'created_at' | 'updated_at' | 'questions'>;
export type QuestionInput = Omit<Question, 'id' | 'material_id' | 'created_at'>;

export interface MaterialFilters {
  jenjang?:        JenjangLevel;
  mata_pelajaran?: MataPelajaran;
  topik?:          string;
  tipe?:           MaterialTipe;
  status?:         MaterialStatus;
  tutor_id?:       string;
}

export const materialsApi = {
  getAll: (filters?: MaterialFilters) => {
    const p = new URLSearchParams();
    if (filters?.jenjang)        p.set('jenjang',        filters.jenjang);
    if (filters?.mata_pelajaran) p.set('mata_pelajaran', filters.mata_pelajaran);
    if (filters?.topik)          p.set('topik',          filters.topik);
    if (filters?.tipe)           p.set('tipe',           filters.tipe);
    if (filters?.status)         p.set('status',         filters.status);
    if (filters?.tutor_id)       p.set('tutor_id',       filters.tutor_id);
    return api.get<Material[]>(`/api/materials?${p}`).then((r) => r.data);
  },

  getById: (id: string, withQuestions = false) =>
    api.get<Material>(`/api/materials/${id}?with_questions=${withQuestions}`).then((r) => r.data),

  create: (input: Partial<MaterialInput> & { tipe: MaterialTipe }) =>
    api.post<Material>('/api/materials', input).then((r) => r.data),

  update: (id: string, input: Partial<MaterialInput>) =>
    api.put<Material>(`/api/materials/${id}`, input).then((r) => r.data),

  updateStatus: (id: string, status: MaterialStatus) =>
    api.patch<Material>(`/api/materials/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) => api.delete(`/api/materials/${id}`),

  // Questions
  getQuestions: (materialId: string) =>
    api.get<Question[]>(`/api/materials/${materialId}/questions`).then((r) => r.data),

  addQuestion: (materialId: string, input: Partial<QuestionInput>) =>
    api.post<Question>(`/api/materials/${materialId}/questions`, input).then((r) => r.data),

  updateQuestion: (materialId: string, qid: string, input: Partial<QuestionInput>) =>
    api.put<Question>(`/api/materials/${materialId}/questions/${qid}`, input).then((r) => r.data),

  deleteQuestion: (materialId: string, qid: string) =>
    api.delete(`/api/materials/${materialId}/questions/${qid}`),
};
