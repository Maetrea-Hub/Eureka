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
  action?:  string;
  from?:    string;
  to?:      string;
  limit?:   number;
  offset?:  number;
}
