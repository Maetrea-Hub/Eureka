import * as repo from './repository.js';
import type { CrmStudent, CrmNote, CreateNoteInput } from './types.js';

export async function listStudents(): Promise<CrmStudent[]> {
  return repo.findStudents();
}

export async function listNotes(siswaId: string): Promise<CrmNote[]> {
  return repo.findNotes(siswaId);
}

export async function addNote(
  siswaId: string,
  adminId: string,
  input:   CreateNoteInput,
): Promise<CrmNote> {
  if (!input.catatan.trim()) throw new Error('Catatan tidak boleh kosong');
  return repo.createNote(siswaId, adminId, { catatan: input.catatan.trim() });
}

export async function editNote(noteId: string, catatan: string): Promise<CrmNote> {
  if (!catatan.trim()) throw new Error('Catatan tidak boleh kosong');
  return repo.updateNote(noteId, catatan.trim());
}

export async function removeNote(noteId: string): Promise<void> {
  return repo.deleteNote(noteId);
}
