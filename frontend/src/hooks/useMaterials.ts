import { useCallback, useEffect, useState } from 'react';
import { materialsApi, type Material, type MaterialFilters } from '@/lib/materials-api';
import { extractApiError } from '@/lib/errors';

interface UseMaterialsResult {
  materials: Material[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
}

export function useMaterials(filters?: MaterialFilters): UseMaterialsResult {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const { jenjang, mata_pelajaran, topik, tipe, status, tutor_id } = filters ?? {};

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await materialsApi.getAll(
        { jenjang, mata_pelajaran, topik, tipe, status, tutor_id } as MaterialFilters,
      );
      setMaterials(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [jenjang, mata_pelajaran, topik, tipe, status, tutor_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { materials, isLoading, error, refetch: fetch };
}
