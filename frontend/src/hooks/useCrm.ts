import { useState, useEffect, useCallback } from 'react';
import { crmApi, type CrmStudent, type CrmNote } from '@/lib/crm-api';

export function useCrmStudents() {
  const [students,  setStudents]  = useState<CrmStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try   { setStudents(await crmApi.getStudents()); }
    catch { setStudents([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);
  return { students, isLoading, refetch: fetch };
}

export function useCrmNotes(siswaId: string | null) {
  const [notes,     setNotes]     = useState<CrmNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async (id: string) => {
    setIsLoading(true);
    try   { setNotes(await crmApi.getNotes(id)); }
    catch { setNotes([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (siswaId) void fetch(siswaId);
    else setNotes([]);
  }, [siswaId, fetch]);

  async function addNote(catatan: string) {
    if (!siswaId) return;
    const note = await crmApi.addNote(siswaId, catatan);
    setNotes(prev => [note, ...prev]);
  }

  async function updateNote(noteId: string, catatan: string) {
    const updated = await crmApi.updateNote(noteId, catatan);
    setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
  }

  async function deleteNote(noteId: string) {
    await crmApi.deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  return { notes, isLoading, addNote, updateNote, deleteNote };
}
