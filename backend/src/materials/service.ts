import * as repo from './repository';
import * as notifRepo from '../notifications/repository';
import * as notifService from '../notifications/service';
import type {
  Material, MaterialInput, MaterialFilters, MaterialStatus,
  Question, QuestionInput,
} from './types';

// ── Materials ─────────────────────────────────────────────────

export async function listMaterials(filters: MaterialFilters): Promise<Material[]> {
  return repo.findAll(filters);
}

export async function getMaterialById(
  id: string,
  withQuestions = false,
): Promise<Material> {
  const material = await repo.findById(id);
  if (!material) throw new Error('Materi tidak ditemukan');

  if (withQuestions && material.tipe === 'bank_soal') {
    material.questions = await repo.findQuestions(id);
  }
  return material;
}

export async function createMaterial(
  input: MaterialInput,
): Promise<Material> {
  validateTypeColumns(input);
  return repo.create({ ...input, status: input.status ?? 'draft' });
}

export async function updateMaterial(
  id: string,
  input: Partial<MaterialInput>,
  requesterId: string,
  requesterRole: string,
): Promise<Material> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Materi tidak ditemukan');

  // Tutor hanya bisa update materi miliknya
  if (requesterRole === 'tutor' && existing.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  validateTypeColumns({ ...existing, ...input });
  return repo.update(id, input);
}

export async function updateStatus(
  id: string,
  status: MaterialStatus,
  requesterId: string,
  requesterRole: string,
): Promise<Material> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Materi tidak ditemukan');

  if (requesterRole === 'tutor' && existing.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  // Notifikasi materi_baru ke siswa yang relevan saat pertama kali dipublish
  if (status === 'published' && existing.status !== 'published') {
    void notifRepo.findEnrolledSiswaForMaterial(existing.jenjang, existing.mata_pelajaran)
      .then((siswa) =>
        notifService.dispatchToMany(siswa, 'materi_baru', (nama) => ({
          nama_siswa:  nama,
          nama_materi: existing.judul,
        })),
      );
  }

  return repo.update(id, { status });
}

export async function deleteMaterial(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('Materi tidak ditemukan');

  if (requesterRole === 'tutor' && existing.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  const accessed = await repo.isAccessed(id);
  if (accessed) {
    throw new Error(
      'Materi tidak bisa dihapus karena sudah pernah diakses siswa. ' +
      'Ubah status menjadi nonaktif untuk menyembunyikannya.',
    );
  }

  await repo.remove(id);
}

// ── Questions ─────────────────────────────────────────────────

export async function listQuestions(materialId: string): Promise<Question[]> {
  const material = await repo.findById(materialId);
  if (!material) throw new Error('Materi tidak ditemukan');
  if (material.tipe !== 'bank_soal') throw new Error('Materi ini bukan Bank Soal');
  return repo.findQuestions(materialId);
}

export async function addQuestion(
  materialId: string,
  input: QuestionInput,
  requesterId: string,
  requesterRole: string,
): Promise<Question> {
  const material = await repo.findById(materialId);
  if (!material) throw new Error('Materi tidak ditemukan');
  if (material.tipe !== 'bank_soal') throw new Error('Materi ini bukan Bank Soal');

  if (requesterRole === 'tutor' && material.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  validateQuestion(input);
  return repo.createQuestion(materialId, input);
}

export async function editQuestion(
  materialId: string,
  questionId: string,
  input: Partial<QuestionInput>,
  requesterId: string,
  requesterRole: string,
): Promise<Question> {
  const material = await repo.findById(materialId);
  if (!material) throw new Error('Materi tidak ditemukan');

  if (requesterRole === 'tutor' && material.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  const question = await repo.findQuestionById(questionId);
  if (!question || question.material_id !== materialId) {
    throw new Error('Pertanyaan tidak ditemukan');
  }

  const merged = { ...question, ...input };
  validateQuestion(merged as QuestionInput);
  return repo.updateQuestion(questionId, input);
}

export async function deleteQuestion(
  materialId: string,
  questionId: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  const material = await repo.findById(materialId);
  if (!material) throw new Error('Materi tidak ditemukan');

  if (requesterRole === 'tutor' && material.tutor_id !== requesterId) {
    throw new Error('Anda tidak memiliki akses ke materi ini');
  }

  const question = await repo.findQuestionById(questionId);
  if (!question || question.material_id !== materialId) {
    throw new Error('Pertanyaan tidak ditemukan');
  }

  await repo.removeQuestion(questionId);
}

// ── Internal validators ───────────────────────────────────────

function validateTypeColumns(input: Partial<MaterialInput>): void {
  if (input.tipe === 'video' && input.file_url) {
    throw new Error('Materi video tidak boleh memiliki file_url');
  }
  if (input.tipe === 'bank_soal' && (input.file_url || input.video_url)) {
    throw new Error('Materi Bank Soal tidak boleh memiliki file_url atau video_url');
  }
  if (input.tipe === 'dokumen' && input.video_url) {
    throw new Error('Materi dokumen tidak boleh memiliki video_url');
  }
}

function validateQuestion(input: QuestionInput): void {
  if (input.tipe_soal === 'pilihan_ganda') {
    if (!input.opsi_jawaban || input.opsi_jawaban.length < 2) {
      throw new Error('Pilihan ganda wajib memiliki minimal 2 opsi jawaban');
    }
    const correctCount = input.opsi_jawaban.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
      throw new Error('Pilihan ganda harus memiliki tepat 1 jawaban benar');
    }
  }
  if (input.ada_timer && !input.durasi_timer_detik) {
    throw new Error('Durasi timer wajib diisi jika timer diaktifkan');
  }
}
