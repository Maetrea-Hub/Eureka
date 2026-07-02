import * as repo from './repository';
import type { ProgramFilters } from './repository';
import type { Program, ProgramInput } from './types';
import { logAudit } from '../audit/service';

export async function listPrograms(filters: ProgramFilters): Promise<Program[]> {
  return repo.findAll(filters);
}

export async function getProgramById(id: string): Promise<Program> {
  const program = await repo.findById(id);
  if (!program) throw new Error('Program tidak ditemukan');
  return program;
}

export async function createProgram(input: ProgramInput, actorId: string): Promise<Program> {
  const program = await repo.create(input);
  logAudit(actorId, 'admin', 'create_program', 'programs', program.id, { nama: program.nama });
  return program;
}

export async function updateProgram(
  id:      string,
  input:   Partial<ProgramInput>,
  actorId: string,
): Promise<Program> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');

  if (input.kapasitas !== undefined && input.kapasitas !== existing.kapasitas) {
    const inUse = await repo.isInUse(id);
    if (inUse) {
      throw new Error(
        'Kapasitas tidak bisa diubah karena program ini sedang aktif digunakan siswa',
      );
    }
  }

  const updated = await repo.update(id, input);
  logAudit(actorId, 'admin', 'update_program', 'programs', id, { nama: existing.nama });
  return updated;
}

export async function toggleStatus(id: string, status: boolean): Promise<Program> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');
  return repo.update(id, { status });
}

export async function deleteProgram(id: string, actorId: string): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');

  const inUse = await repo.isInUse(id);
  if (inUse) {
    throw new Error(
      'Program tidak bisa dihapus karena sedang aktif digunakan siswa. ' +
      'Nonaktifkan program terlebih dahulu melalui toggle status.',
    );
  }

  await repo.remove(id);
  logAudit(actorId, 'admin', 'delete_program', 'programs', id, { nama: existing.nama });
}
