import { useCallback, useEffect, useState } from 'react';
import { schedulesApi, type Schedule, type ScheduleFilters } from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';

interface UseSchedulesResult {
  schedules: Schedule[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
}

export function useSchedules(filters?: ScheduleFilters): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const { status, tutor_id, program_id, tanggal_from, tanggal_to } = filters ?? {};

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await schedulesApi.getAll(
        { status, tutor_id, program_id, tanggal_from, tanggal_to } as ScheduleFilters,
      );
      setSchedules(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [status, tutor_id, program_id, tanggal_from, tanggal_to]);

  useEffect(() => { fetch(); }, [fetch]);

  return { schedules, isLoading, error, refetch: fetch };
}
