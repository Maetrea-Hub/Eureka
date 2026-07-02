import { useState, useCallback } from 'react';
import { auditApi, type AuditLog, type AuditFilters } from '@/lib/audit-api';

export function useAudit() {
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore,   setHasMore]   = useState(true);
  const [filters,   setFilters]   = useState<AuditFilters>({ limit: 50, offset: 0 });

  const fetch = useCallback(async (f: AuditFilters) => {
    setIsLoading(true);
    try {
      const data = await auditApi.getAll(f);
      if (f.offset === 0) {
        setLogs(data);
      } else {
        setLogs(prev => [...prev, ...data]);
      }
      setHasMore(data.length === (f.limit ?? 50));
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function applyFilters(partial: Partial<AuditFilters>) {
    const next = { ...filters, ...partial, offset: 0 };
    setFilters(next);
    void fetch(next);
  }

  function loadMore() {
    const next = { ...filters, offset: (filters.offset ?? 0) + (filters.limit ?? 50) };
    setFilters(next);
    void fetch(next);
  }

  // Initial load
  useState(() => { void fetch(filters); });

  return { logs, isLoading, hasMore, applyFilters, loadMore };
}
