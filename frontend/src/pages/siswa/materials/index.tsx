import { useState } from 'react';
import {
  Bell, BookOpen, Calendar, CreditCard, LayoutDashboard, Package,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { MaterialStatusBadge } from '@/components/materials/MaterialStatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useMaterials } from '@/hooks/useMaterials';
import {
  MAPEL_LIST, MAPEL_LABEL, TIPE_LABEL,
  type JenjangLevel, type MataPelajaran, type MaterialTipe, type Material,
} from '@/lib/materials-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/siswa',               icon: LayoutDashboard },
  { label: 'Program Saya', href: '/siswa/programs',      icon: Package },
  { label: 'Jadwal Kelas', href: '/siswa/schedules',     icon: Calendar },
  { label: 'Materi',       href: '/siswa/materials',     icon: BookOpen },
  { label: 'Pembayaran',   href: '/siswa/transactions',  icon: CreditCard },
  { label: 'Notifikasi',   href: '/siswa/notifications', icon: Bell },
];

function MaterialCard({ material }: { material: Material }) {
  const tipeLabel = TIPE_LABEL[material.tipe];

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold leading-snug">{material.judul}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{material.topik}</p>
        </div>
        <MaterialStatusBadge status={material.status} />
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs">{tipeLabel}</Badge>
        <Badge variant="outline" className="text-xs">{material.jenjang}</Badge>
        <Badge variant="outline" className="text-xs">{MAPEL_LABEL[material.mata_pelajaran]}</Badge>
        {material.tipe === 'dokumen' && material.bisa_download && (
          <Badge variant="outline" className="text-xs text-muted-foreground">Bisa Download</Badge>
        )}
        {material.tipe === 'video' && (
          <Badge variant="outline" className="text-xs text-muted-foreground">Streaming Only</Badge>
        )}
      </div>
    </div>
  );
}

export default function SiswaMaterials() {
  const [filterJenjang, setFilterJenjang] = useState<JenjangLevel | ''>('');
  const [filterMapel,   setFilterMapel]   = useState<MataPelajaran | ''>('');
  const [activeTab,     setActiveTab]     = useState<MaterialTipe>('dokumen');

  const { materials, isLoading } = useMaterials({
    status:         'published',
    jenjang:        filterJenjang || undefined,
    mata_pelajaran: filterMapel   || undefined,
  });

  const filtered = materials.filter((m) => m.tipe === activeTab);

  return (
    <DashboardLayout navItems={navItems} pageTitle="Materi Belajar">
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={filterJenjang}
          onValueChange={(v) => setFilterJenjang(v as JenjangLevel | '')}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semua Jenjang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Jenjang</SelectItem>
            <SelectItem value="SD">SD</SelectItem>
            <SelectItem value="SMP">SMP</SelectItem>
            <SelectItem value="SMA">SMA</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterMapel}
          onValueChange={(v) => setFilterMapel(v as MataPelajaran | '')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Mapel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Mapel</SelectItem>
            {MAPEL_LIST.map((m) => (
              <SelectItem key={m} value={m}>{MAPEL_LABEL[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs by tipe */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaterialTipe)}>
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

        {(['dokumen', 'video', 'bank_soal'] as MaterialTipe[]).map((t) => (
          <TabsContent key={t} value={t}>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                message="Belum ada materi tersedia"
                description="Materi baru akan muncul di sini setelah tutor mempublishnya"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => <MaterialCard key={m.id} material={m} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}
