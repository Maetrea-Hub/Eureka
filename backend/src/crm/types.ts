export interface CrmStudent {
  id:               string;
  nama_lengkap:     string;
  email:            string;
  nomor_whatsapp:   string | null;
  created_at:       string;
  enrollment_count: number;
  note_count:       number;
}

export interface CrmNote {
  id:         string;
  siswa_id:   string;
  admin_id:   string;
  catatan:    string;
  created_at: string;
  updated_at: string;
  admin?:     { nama_lengkap: string | null } | null;
}

export interface CreateNoteInput {
  catatan: string;
}
