import { useState } from 'react';
import {
  BookOpen, Calendar, CreditCard, ExternalLink, LayoutDashboard, Package, Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { ScheduleStatusBadge } from '@/components/schedules/ScheduleStatusBadge';
import { AttendanceTable } from '@/components/schedules/AttendanceTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSchedules } from '@/hooks/useSchedules';
import {
  schedulesApi, type Schedule, type ScheduleStatus, STATUS_LABEL,
} from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/siswa',           icon: LayoutDashboard },
  { label: 'Program Saya',                           icon: Package },
  { label: 'Jadwal Kelas', href: '/siswa/schedules', icon: Calendar },
  { label: 'Materi',       href: '/siswa/materials', icon: BookOpen },
  { label: 'Pembayaran',                             icon: CreditCard },
];

const STATUS_OPTIONS: Array<{ value: ScheduleStatus | ''; label: string }> = [
  { value: '', label: 'Semua' },
  { value: 'scheduled',   label: STATUS_LABEL['scheduled'] },
  { value: 'berlangsung', label: STATUS_LABEL['berlangsung'] },
  { value: 'selesai',     label: STATUS_LABEL['selesai'] },
];

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const [joining,       setJoining]       = useState(false);
  const [attendanceId,  setAttendanceId]  = useState<string | null>(null);
  const canJoin = schedule.status === 'scheduled' || schedule.status === 'berlangsung';

  async function handleJoin() {
    setJoining(true);
    try {
      const { join_url, attendance } = await schedulesApi.join(schedule.id);
      toast.success(`Absensi tercatat: ${attendance.status === 'hadir' ? 'Hadir' : 'Terlambat'}`);
      window.open(join_url, '_blank', 'noopener');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-snug truncate">{schedule.judul_kelas}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {schedule.tanggal} · {schedule.jam_mulai} – {schedule.jam_selesai} WIB
          </p>
        </div>
        <ScheduleStatusBadge status={schedule.status} />
      </div>

      {schedule.zoom_password && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">Password: {schedule.zoom_password}</Badge>
        </div>
      )}

      {schedule.cancel_reason && (
        <p className="text-xs text-destructive">Alasan: {schedule.cancel_reason}</p>
      )}

      <div className="flex gap-2">
        {canJoin && (
          <Button
            size="sm"
            className="flex-1"
            onClick={handleJoin}
            disabled={joining}
          >
            <Video className="mr-2 h-4 w-4" />
            {joining ? 'Membuka…' : 'Masuk Kelas'}
          </Button>
        )}
        {schedule.zoom_join_url && !canJoin && (
          <a href={schedule.zoom_join_url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Link Zoom
            </Button>
          </a>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAttendanceId(schedule.id)}
        >
          Absensi Saya
        </Button>
      </div>

      <AttendanceTable
        scheduleId={attendanceId}
        scheduleTitle={schedule.judul_kelas}
        onClose={() => setAttendanceId(null)}
      />
    </div>
  );
}

export default function SiswaSchedules() {
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | ''>('');

  const { schedules, isLoading } = useSchedules(
    filterStatus ? { status: filterStatus } : undefined,
  );

  return (
    <DashboardLayout navItems={navItems} pageTitle="Jadwal Kelas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Jadwal Kelas Saya</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{schedules.length} jadwal</p>
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ScheduleStatus | '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !schedules.length ? (
        <EmptyState
          icon={Calendar}
          message="Belum ada jadwal kelas"
          description="Jadwal kelas akan muncul di sini setelah Anda mendaftar program"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
