import { useState, useEffect, useCallback } from 'react';
import { enrollmentsApi, type Enrollment } from '@/lib/payments-api';

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  const fetchEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await enrollmentsApi.list();
      setEnrollments(data);
    } catch {
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchEnrollments(); }, [fetchEnrollments]);

  return { enrollments, isLoading, refetch: fetchEnrollments };
}
