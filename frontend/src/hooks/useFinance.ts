import { useState, useEffect, useCallback } from 'react';
import { financeApi, type FinanceSummary, type MonthlyRevenue, type ProgramRevenue } from '@/lib/finance-api';

export function useFinanceSummary() {
  const [summary,   setSummary]   = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try   { setSummary(await financeApi.getSummary()); }
    catch { setSummary(null); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);
  return { summary, isLoading, refetch: fetch };
}

export function useFinanceByMonth(year: number) {
  const [data,      setData]      = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try   { setData(await financeApi.getByMonth(year)); }
    catch { setData([]); }
    finally { setIsLoading(false); }
  }, [year]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading };
}

export function useFinanceByProgram() {
  const [data,      setData]      = useState<ProgramRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try   { setData(await financeApi.getByProgram()); }
    catch { setData([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading };
}
