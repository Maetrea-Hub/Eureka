import * as repo from './repository';
import type { ProgramFilters } from './repository';
import type { Program, ProgramInput } from './types';

export async function listPrograms(filters: ProgramFilters): Promise<Program[]> {
  return repo.findAll(filters);
}

export async function getProgramById(id: string): Promise<Program> {
  const program = await repo.findById(id);
  if (!program) throw new Error('Program tidak ditemukan');
  return program;
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  return repo.create(input);
}

export async function updateProgram(
  id: string,
  input: Partial<ProgramInput>,
): Promise<Program> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');

  // Kapasitas tidak boleh diubah jika program sedang aktif digunakan
  // (isInUse selalu false sampai Blok 12 — lihat KNOWN GAP di repository.ts)
  if (input.kapasitas !== undefined && input.kapasitas !== existing.kapasitas) {
    const inUse = await repo.isInUse(id);
    if (inUse) {
      throw new Error(
        'Kapasitas tidak bisa diubah karena program ini sedang aktif digunakan siswa',
      );
    }
  }

  return repo.update(id, input);
}

export async function toggleStatus(id: string, status: boolean): Promise<Program> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');
  return repo.update(id, { status });
}

export async function deleteProgram(id: string): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Program tidak ditemukan');

  // Blok delete jika program sedang aktif digunakan
  // (isInUse selalu false sampai Blok 12 — lihat KNOWN GAP di repository.ts)
  const inUse = await repo.isInUse(id);
  if (inUse) {
    throw new Error(
      'Program tidak bisa dihapus karena sedang aktif digunakan siswa. ' +
      'Nonaktifkan program terlebih dahulu melalui toggle status.',
    );
  }

  await repo.remove(id);
}
