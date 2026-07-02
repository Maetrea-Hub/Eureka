import { useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Calendar, CreditCard,
  FileText, LayoutDashboard, MessageSquare, Package,
  Plus, RotateCcw, Settings2, Trash2, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useCrmStudents, useCrmNotes } from '@/hooks/useCrm';
import { extractApiError } from '@/lib/errors';
import type { CrmStudent } from '@/lib/crm-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',                icon: LayoutDashboard },
  { label: 'Siswa',                                           icon: Users },
  { label: 'Tutor',                                           icon: Settings2 },
  { label: 'Pilihan Program',  href: '/admin/programs',       icon: Package },
  { label: 'Materi',           href: '/admin/materials',      icon: BookOpen },
  { label: 'Jadwal Kelas',     href: '/admin/schedules',      icon: Calendar },
  { label: 'Pembayaran',                                      icon: CreditCard },
  { label: 'Refund Requests',  href: '/admin/refunds',        icon: RotateCcw },
  { label: 'Notifikasi',       href: '/admin/notifications',  icon: Bell },
  { label: 'Laporan Keuangan', href: '/admin/finance',        icon: BarChart3 },
  { label: 'CRM',              href: '/admin/crm',            icon: MessageSquare },
  { label: 'Audit Log',        href: '/admin/audit',          icon: FileText },
];

// ── Notes panel (inside Sheet) ────────────────────────────────

function NotesPanel({ student, onClose }: { student: CrmStudent; onClose: () => void }) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useCrmNotes(student.id);
  const [draft,      setDraft]      = useState('');
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editText,   setEditText]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await addNote(draft.trim());
      setDraft('');
      toast.success('Catatan ditambahkan');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(noteId: string) {
    if (!editText.trim()) return;
    setSubmitting(true);
    try {
      await updateNote(noteId, editText.trim());
      setEditingId(null);
      toast.success('Catatan diperbarui');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(noteId);
      toast.success('Catatan dihapus');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Sheet open onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{student.nama_lengkap}</SheetTitle>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{student.email}</span>
            {student.nomor_whatsapp && <span>· {student.nomor_whatsapp}</span>}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{student.enrollment_count} program aktif</Badge>
            <Badge variant="outline">{notes.length} catatan</Badge>
          </div>
        </SheetHeader>

        {/* Add note */}
        <div className="mb-4 space-y-2">
          <Textarea
            placeholder="Tambah catatan tentang siswa ini..."
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
          <Button size="sm" onClick={handleAdd} disabled={!draft.trim() || submitting}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah Catatan
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !notes.length ? (
          <p className="text-sm text-muted-foreground">Belum ada catatan untuk siswa ini.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map(note => (
              <div key={note.id} className="rounded-lg border bg-muted/20 p-3">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(note.id)} disabled={submitting}>Simpan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Batal</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{note.catatan}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        <span>{note.admin?.nama_lengkap ?? 'Admin'}</span>
                        <span className="mx-1">·</span>
                        <span>{new Date(note.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => { setEditingId(note.id); setEditText(note.catatan); }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function AdminCrm() {
  const { students, isLoading }       = useCrmStudents();
  const [search,   setSearch]         = useState('');
  const [selected, setSelected]       = useState<CrmStudent | null>(null);

  const filtered = students.filter(s =>
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout navItems={navItems} pageTitle="CRM Siswa">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">CRM Siswa</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{students.length} siswa terdaftar</p>
        </div>
        <Input
          placeholder="Cari nama atau email..."
          className="w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={Users} message="Tidak ada siswa" description="Belum ada data siswa yang sesuai pencarian" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 text-center font-medium">Program Aktif</th>
                <th className="px-4 py-3 text-center font-medium">Catatan</th>
                <th className="px-4 py-3 font-medium">Terdaftar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3 font-medium">{s.nama_lengkap}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.nomor_whatsapp ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.enrollment_count > 0 ? 'default' : 'outline'}>
                      {s.enrollment_count}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{s.note_count}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm" variant="outline"
                      onClick={e => { e.stopPropagation(); setSelected(s); }}
                    >
                      Lihat
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <NotesPanel student={selected} onClose={() => setSelected(null)} />
      )}
    </DashboardLayout>
  );
}
