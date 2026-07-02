import { useState } from 'react';
import {
  Bell, BookOpen, Calendar, LayoutDashboard, Plus, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { ScheduleTable } from '@/components/schedules/ScheduleTable';
import { ScheduleFormSheet } from '@/components/schedules/ScheduleFormSheet';
import { CancelDialog } from '@/components/schedules/CancelDialog';
import { RescheduleDialog } from '@/components/schedules/RescheduleDialog';
import { AttendanceTable } from '@/components/schedules/AttendanceTable';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSchedules } from '@/hooks/useSchedules';
import { type Schedule, type ScheduleStatus, STATUS_LABEL } from '@/lib/schedules-api';

const navItems: NavItem[] = [
  { label: 'Dashboard',  href: '/tutor',               icon: LayoutDashboard },
  { label: 'Jadwal',     href: '/tutor/schedules',     icon: Calendar },
  { label: 'Materi',     href: '/tutor/materials',     icon: BookOpen },
  { label: 'Siswa',                                    icon: Users },
  { label: 'Notifikasi', href: '/tutor/notifications', icon: Bell },
];

const STATUS_OPTIONS: Array<{ value: ScheduleStatus | ''; label: string }> = [
  { value: '', label: 'Semua Status' },
  ...(['scheduled', 'berlangsung', 'selesai', 'dibatalkan', 'dijadwalkan_ulang'] as ScheduleStatus[])
    .map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

export default function TutorSchedules() {
  const [filterStatus,      setFilterStatus]      = useState<ScheduleStatus | ''>('');
  const [sheetOpen,         setSheetOpen]         = useState(false);
  const [editingSchedule,   setEditingSchedule]   = useState<Schedule | undefined>();
  const [cancellingSchedule, setCancellingSchedule] = useState<Schedule | null>(null);
  const [rescheduling,      setRescheduling]      = useState<Schedule | null>(null);
  const [attendanceId,      setAttendanceId]      = useState<string | null>(null);
  const [attendanceTitle,   setAttendanceTitle]   = useState('');

  const { schedules, isLoading, refetch } = useSchedules(
    filterStatus ? { status: filterStatus } : undefined,
  );

  function openCreate() { setEditingSchedule(undefined); setSheetOpen(true); }
  function openEdit(s: Schedule) { setEditingSchedule(s); setSheetOpen(true); }
  function openAttendance(s: Schedule) { setAttendanceId(s.id); setAttendanceTitle(s.judul_kelas); }

  return (
    <DashboardLayout navItems={navItems} pageTitle="Kelola Jadwal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Jadwal Kelas Saya</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{schedules.length} jadwal</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ScheduleStatus | '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        onEdit={openEdit}
        onCancel={setCancellingSchedule}
        onReschedule={setRescheduling}
        onViewAttendance={openAttendance}
        onRefetch={refetch}
      />

      <ScheduleFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={refetch}
        schedule={editingSchedule}
      />

      <CancelDialog
        schedule={cancellingSchedule}
        onClose={() => setCancellingSchedule(null)}
        onDone={refetch}
      />

      <RescheduleDialog
        schedule={rescheduling}
        onClose={() => setRescheduling(null)}
        onDone={refetch}
      />

      <AttendanceTable
        scheduleId={attendanceId}
        scheduleTitle={attendanceTitle}
        onClose={() => setAttendanceId(null)}
      />
    </DashboardLayout>
  );
}
