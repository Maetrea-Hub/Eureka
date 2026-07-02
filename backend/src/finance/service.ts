import * as repo from './repository.js';
import type { FinanceSummary, MonthlyRevenue, ProgramRevenue, ExportRow } from './types.js';

export async function getSummary(): Promise<FinanceSummary> {
  return repo.getSummary();
}

export async function getByMonth(year: number): Promise<MonthlyRevenue[]> {
  return repo.getByMonth(year);
}

export async function getByProgram(): Promise<ProgramRevenue[]> {
  return repo.getByProgram();
}

export async function getForExport(from?: string, to?: string): Promise<ExportRow[]> {
  return repo.getForExport(from, to);
}
