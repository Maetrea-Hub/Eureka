import { useState } from 'react';
import {
  BookOpen, Calendar, CreditCard, LayoutDashboard, Package, ShoppingCart,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { CheckoutDialog } from '@/components/payments/CheckoutDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEnrollments } from '@/hooks/useEnrollments';
import { usePrograms } from '@/hooks/usePrograms';
import {
  ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_COLOR, formatRupiah,
  type Enrollment,
} from '@/lib/payments-api';
import { TIPE_LABEL, MAPEL_LABEL, type Program } from '@/lib/programs-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/siswa',             icon: LayoutDashboard },
  { label: 'Program Saya', href: '/siswa/programs',    icon: Package },
  { label: 'Jadwal Kelas', href: '/siswa/schedules',   icon: Calendar },
  { label: 'Materi',       href: '/siswa/materials',   icon: BookOpen },
  { label: 'Pembayaran',   href: '/siswa/transactions', icon: CreditCard },
];

// ── Enrollment Card ───────────────────────────────────────────

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const prog = enrollment.programs;
  const statusColor = ENROLLMENT_STATUS_COLOR[enrollment.status];
  const statusLabel = ENROLLMENT_STATUS_LABEL[enrollment.status];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{prog?.nama ?? '—'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {prog ? `${TIPE_LABEL[prog.tipe_layanan as keyof typeof TIPE_LABEL] ?? prog.tipe_layanan} · ${prog.jenjang}` : ''}
          </p>
        </div>
        <Badge className={statusColor}>{statusLabel}</Badge>
      </div>

      {prog?.mata_pelajaran && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(prog.mata_pelajaran as string[]).map((mp) => (
            <Badge key={mp} variant="outline" className="text-xs">
              {MAPEL_LABEL[mp as keyof typeof MAPEL_LABEL] ?? mp}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Mulai: {new Date(enrollment.enrolled_at).toLocaleDateString('id-ID')}</span>
        {enrollment.expires_at
          ? <span>Berakhir: {new Date(enrollment.expires_at).toLocaleDateString('id-ID')}</span>
          : <span className="text-green-600">Tidak ada expiry</span>}
      </div>
    </div>
  );
}

// ── Program Card (untuk beli) ─────────────────────────────────

function BrowseProgramCard({
  program,
  onBuy,
}: {
  program: Program;
  onBuy:   (program: Program) => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex-1">
        <p className="font-semibold">{program.nama}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {TIPE_LABEL[program.tipe_layanan]} · {program.jenjang} · {program.durasi}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {program.mata_pelajaran.map((mp) => (
            <Badge key={mp} variant="outline" className="text-xs">
              {MAPEL_LABEL[mp]}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-lg font-bold text-primary">{formatRupiah(program.tarif)}</p>
        <p className="text-xs text-muted-foreground">Kapasitas: {program.kapasitas} siswa</p>
      </div>

      <Button className="mt-4 w-full" size="sm" onClick={() => onBuy(program)}>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Daftar Sekarang
      </Button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function SiswaPrograms() {
  const { enrollments, isLoading: loadingEnroll, refetch } = useEnrollments();
  const { programs,    isLoading: loadingPrograms }         = usePrograms();
  const [checkoutProgram, setCheckoutProgram] = useState<Program | null>(null);

  const activePrograms = programs.filter((p) => p.status);

  return (
    <DashboardLayout navItems={navItems} pageTitle="Program Saya">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Program Saya</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {enrollments.filter((e) => e.status === 'active').length} program aktif
        </p>
      </div>

      <Tabs defaultValue="aktif">
        <TabsList className="mb-4">
          <TabsTrigger value="aktif">Program Aktif</TabsTrigger>
          <TabsTrigger value="beli">Beli Program</TabsTrigger>
        </TabsList>

        {/* Tab: enrollment aktif */}
        <TabsContent value="aktif">
          {loadingEnroll ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !enrollments.length ? (
            <EmptyState
              icon={Package}
              message="Belum ada program"
              description="Beli program dari tab 'Beli Program' untuk mulai belajar"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)}
            </div>
          )}
        </TabsContent>

        {/* Tab: browse program untuk dibeli */}
        <TabsContent value="beli">
          {loadingPrograms ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !activePrograms.length ? (
            <EmptyState
              icon={ShoppingCart}
              message="Tidak ada program tersedia"
              description="Saat ini belum ada program yang aktif"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activePrograms.map((p) => (
                <BrowseProgramCard
                  key={p.id}
                  program={p}
                  onBuy={setCheckoutProgram}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {checkoutProgram && (
        <CheckoutDialog
          open={!!checkoutProgram}
          onClose={() => setCheckoutProgram(null)}
          onPaid={() => { void refetch(); }}
          programId={checkoutProgram.id}
          programNama={checkoutProgram.nama}
          tarif={checkoutProgram.tarif}
        />
      )}
    </DashboardLayout>
  );
}
