import { supabase } from '../lib/supabase.js';
import type { AuditLog, AuditFilters } from './types.js';

export const AUDIT_ACTIONS = [
  'admin_login',
  'change_password',
  'create_program',
  'update_program',
  'delete_program',
  'cancel_schedule',
  'reschedule_schedule',
  'request_refund',
  'process_refund',
  'force_majeure_refund',
  'publish_material',
] as const;

export async function insert(data: {
  actor_id:     string | null;
  actor_role:   string | null;
  action:       string;
  entity_type?: string;
  entity_id?:   string;
  detail?:      Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id:    data.actor_id,
    actor_role:  data.actor_role,
    action:      data.action,
    entity_type: data.entity_type ?? null,
    entity_id:   data.entity_id   ?? null,
    detail:      data.detail      ?? null,
  });
  if (error) console.error('[audit] insert error:', error.message);
}

export async function findAll(filters: AuditFilters): Promise<AuditLog[]> {
  const limit  = Math.min(filters.limit  ?? 50, 200);
  const offset = filters.offset ?? 0;

  let q = supabase
    .from('audit_logs')
    .select('*, actor:actor_id(nama_lengkap)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.action) q = q.eq('action', filters.action);
  if (filters.from)   q = q.gte('created_at', filters.from);
  if (filters.to)     q = q.lte('created_at', filters.to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AuditLog[];
}
