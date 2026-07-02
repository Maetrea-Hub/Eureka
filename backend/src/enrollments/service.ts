import * as repo from './repository.js';
import type { Enrollment } from './types.js';

export async function listEnrollments(siswaId: string): Promise<Enrollment[]> {
  return repo.findBySiswa(siswaId);
}

export async function checkEnrollment(siswaId: string, programId: string): Promise<boolean> {
  return repo.isEnrolled(siswaId, programId);
}
