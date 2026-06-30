import { useState } from 'react';
import {
  BookOpen, Calendar, LayoutDashboard, Plus, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { MaterialTable } from '@/components/materials/MaterialTable';
import { MaterialFormSheet } from '@/components/materials/MaterialFormSheet';
import { MaterialDeleteDialog } from '@/components/materials/MaterialDeleteDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useMaterials } from '@/hooks/useMaterials';
import { useAuth } from '@/hooks/useAuth';
import type { Material, MaterialTipe } from '@/lib/materials-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',       href: '/tutor',           icon: LayoutDashboard },
  { label: 'Kelola Jadwal',                             icon: Calendar },
  { label: 'Kelola Materi',   href: '/tutor/materials', icon: BookOpen },
  { label: 'Daftar Siswa',                              icon: Users },
];

type TipeTab = MaterialTipe;

export default function TutorMaterials() {
  const { profile } = useAuth();
  const [activeTab,       setActiveTab]       = useState<TipeTab>('dokumen');
  const [sheetOpen,       setSheetOpen]       = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const [deletingMaterial,setDeletingMaterial]= useState<Material | null>(null);

  const { materials, isLoading, refetch } = useMaterials(
    profile?.id ? { tutor_id: profile.id } : undefined,
  );

  const filtered = materials.filter((m) => m.tipe === activeTab);

  function openCreate() { setEditingMaterial(undefined); setSheetOpen(true); }
  function openEdit(m: Material) { setEditingMaterial(m); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setEditingMaterial(undefined); }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Kelola Materi">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Materi Saya</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{materials.length} total materi</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Materi
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TipeTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="dokumen">
            Dokumen ({materials.filter((m) => m.tipe === 'dokumen').length})
          </TabsTrigger>
          <TabsTrigger value="video">
            Video ({materials.filter((m) => m.tipe === 'video').length})
          </TabsTrigger>
          <TabsTrigger value="bank_soal">
            Bank Soal ({materials.filter((m) => m.tipe === 'bank_soal').length})
          </TabsTrigger>
        </TabsList>

        {(['dokumen', 'video', 'bank_soal'] as TipeTab[]).map((t) => (
          <TabsContent key={t} value={t}>
            <MaterialTable
              materials={filtered}
              isLoading={isLoading}
              onEdit={openEdit}
              onDelete={(m) => setDeletingMaterial(m)}
              onRefetch={refetch}
            />
          </TabsContent>
        ))}
      </Tabs>

      <MaterialFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSaved={refetch}
        tipe={activeTab}
        material={editingMaterial}
      />

      <MaterialDeleteDialog
        material={deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onDeleted={refetch}
      />
    </DashboardLayout>
  );
}
