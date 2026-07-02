import api from './axios';

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

export const crmApi = {
  async getStudents(): Promise<CrmStudent[]> {
    const { data } = await api.get<CrmStudent[]>('/crm/students');
    return data;
  },

  async getNotes(siswaId: string): Promise<CrmNote[]> {
    const { data } = await api.get<CrmNote[]>(`/crm/students/${siswaId}/notes`);
    return data;
  },

  async addNote(siswaId: string, catatan: string): Promise<CrmNote> {
    const { data } = await api.post<CrmNote>(`/crm/students/${siswaId}/notes`, { catatan });
    return data;
  },

  async updateNote(noteId: string, catatan: string): Promise<CrmNote> {
    const { data } = await api.patch<CrmNote>(`/crm/notes/${noteId}`, { catatan });
    return data;
  },

  async deleteNote(noteId: string): Promise<void> {
    await api.delete(`/crm/notes/${noteId}`);
  },
};
