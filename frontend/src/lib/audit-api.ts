import { api } from './api';

export interface AuditLog {
  id:          string;
  actor_id:    string | null;
  actor_role:  string | null;
  action:      string;
  entity_type: string | null;
  entity_id:   string | null;
  detail:      Record<string, unknown> | null;
  created_at:  string;
  actor?:      { nama_lengkap: string | null } | null;
}

export interface AuditFilters {
  action?: string;
  from?:   string;
  to?:     string;
  limit?:  number;
  offset?: number;
}

export const ACTION_LABEL: Record<string, string> = {
  admin_login:           'Admin Login',
  change_password:       'Ubah Password',
  create_program:        'Buat Program',
  update_program:        'Update Program',
  delete_program:        'Hapus Program',
  cancel_schedule:       'Cancel Jadwal',
  reschedule_schedule:   'Reschedule Jadwal',
  request_refund:        'Ajukan Refund',
  process_refund:        'Proses Refund',
  force_majeure_refund:  'Force Majeure Refund',
  publish_material:      'Publish Materi',
};

export const auditApi = {
  async getAll(filters?: AuditFilters): Promise<AuditLog[]> {
    const { data } = await api.get<AuditLog[]>('/audit', { params: filters });
    return data;
  },

  async getActions(): Promise<string[]> {
    const { data } = await api.get<string[]>('/audit/actions');
    return data;
  },
};
