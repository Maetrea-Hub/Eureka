import { useCallback, useEffect, useState } from 'react';
import { programsApi, type Program, type ProgramFilters } from '@/lib/programs-api';
import { extractApiError } from '@/lib/errors';

interface UseProgramsResult {
  programs:  Program[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
}

export function usePrograms(filters?: ProgramFilters): UseProgramsResult {
  const [programs,  setPrograms]  = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Destructure to stable primitives — avoids object-reference re-render loop
  const { jenjang, tipe_layanan, status } = filters ?? {};

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await programsApi.getAll(
        { jenjang, tipe_layanan, status } as ProgramFilters,
      );
      setPrograms(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [jenjang, tipe_layanan, status]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  return { programs, isLoading, error, refetch: fetchPrograms };
}
