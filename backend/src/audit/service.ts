import * as repo from './repository.js';
import type { AuditLog, AuditFilters } from './types.js';

// Keys yang akan di-redact sebelum disimpan ke JSONB — cegah data sensitif masuk audit log
const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'hash', 'otp', 'token',
  'snap_token', 'access_token', 'refresh_token', 'secret',
  'secret_token', 'key', 'encryption_key', 'admin_token',
  'encrypted', 'encrypted_access_token', 'encrypted_refresh_token',
  'card_number', 'cvv', 'pin',
]);

function maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      result[k] = '[REDACTED]';
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = maskSensitive(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// Fire-and-forget — tidak pernah blokir alur utama
export function logAudit(
  actorId:     string | null,
  actorRole:   string | null,
  action:      string,
  entityType?: string,
  entityId?:   string,
  detail?:     Record<string, unknown>,
): void {
  const safeDetail = detail ? maskSensitive(detail) : undefined;
  void repo.insert({
    actor_id:    actorId,
    actor_role:  actorRole,
    action,
    entity_type: entityType,
    entity_id:   entityId,
    detail:      safeDetail,
  });
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
  return repo.findAll(filters);
}
