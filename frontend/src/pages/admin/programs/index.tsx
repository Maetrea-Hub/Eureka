import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  BarChart3, Bell, BookOpen, Calendar, CreditCard, FileText,
  LayoutDashboard, MessageSquare, Package, RotateCcw, Settings2, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { ProgramTable } from '@/components/programs/ProgramTable';
import { ProgramFormSheet } from '@/components/programs/ProgramFormSheet';
import { DeleteDialog } from '@/components/programs/DeleteDialog';
import { Button } from '@/components/ui/button';
import { usePrograms } from '@/hooks/usePrograms';
import type { Program } from '@/lib/programs-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',           icon: LayoutDashboard },
  { label: 'Siswa',                                      icon: Users },
  { label: 'Tutor',                                      icon: Settings2 },
  { label: 'Pilihan Program',  href: '/admin/programs',  icon: Package },
  { label: 'Materi',           href: '/admin/materials', icon: BookOpen },
  { label: 'Jadwal Kelas',     href: '/admin/schedules', icon: Calendar },
  { label: 'Pembayaran',                                 icon: CreditCard },
  { label: 'Refund Requests',  href: '/admin/refunds',        icon: RotateCcw },
  { label: 'Notifikasi',       href: '/admin/notifications',  icon: Bell },
  { label: 'Laporan Keuangan',                               icon: BarChart3 },
  { label: 'CRM',                                            icon: MessageSquare },
  { label: 'Audit Log',                                      icon: FileText },
];

export default function AdminPrograms() {
  const { programs, isLoading, refetch } = usePrograms();
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>();
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);

  function openCreate() {
    setEditingProgram(undefined);
    setSheetOpen(true);
  }

  function openEdit(program: Program) {
    setEditingProgram(program);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingProgram(undefined);
  }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Pilihan Program">
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pilihan Program</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {programs.length} program terdaftar
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Program
        </Button>
      </div>

      {/* Table */}
      <ProgramTable
        programs={programs}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(p) => setDeletingProgram(p)}
        onRefetch={refetch}
      />

      {/* Create / Edit Sheet */}
      <ProgramFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSaved={refetch}
        program={editingProgram}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        program={deletingProgram}
        onClose={() => setDeletingProgram(null)}
        onDeleted={refetch}
      />
    </DashboardLayout>
  );
}
