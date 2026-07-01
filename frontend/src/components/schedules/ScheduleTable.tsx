import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarX, ExternalLink, MoreHorizontal, Pencil, RefreshCw, Users, Video } from 'lucide-react';
import { ScheduleStatusBadge } from './ScheduleStatusBadge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Calendar } from 'lucide-react';
import { schedulesApi, type Schedule } from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';

interface Props {
  schedules:        Schedule[];
  isLoading:        boolean;
  onEdit:           (s: Schedule) => void;
  onCancel:         (s: Schedule) => void;
  onReschedule:     (s: Schedule) => void;
  onViewAttendance: (s: Schedule) => void;
  onRefetch:        () => void;
  showTutor?:       boolean; // admin view shows tutor_id
}

export function ScheduleTable({
  schedules, isLoading, onEdit, onCancel, onReschedule, onViewAttendance, onRefetch, showTutor,
}: Props) {
  const [endingId, setEndingId] = useState<string | null>(null);

  async function handleEnd(s: Schedule) {
    if (!confirm(`Akhiri kelas "${s.judul_kelas}"? Siswa yang belum join akan dicatat tidak hadir.`)) return;
    setEndingId(s.id);
    try {
      await schedulesApi.end(s.id);
      toast.success(`Kelas "${s.judul_kelas}" telah diakhiri`);
      onRefetch();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setEndingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!schedules.length) {
    return (
      <EmptyState
        icon={Calendar}
        message="Belum ada jadwal"
        description="Tambah jadwal kelas baru dengan tombol di atas"
      />
    );
  }

  const canEdit = (s: Schedule) =>
    s.status !== 'dibatalkan' && s.status !== 'selesai' && s.status !== 'dijadwalkan_ulang';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kelas</TableHead>
          <TableHead>Tanggal & Waktu</TableHead>
          <TableHead>Status</TableHead>
          {showTutor && <TableHead className="hidden lg:table-cell">Tutor</TableHead>}
          <TableHead>Zoom</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <div className="font-medium">{s.judul_kelas}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                {s.program_id}
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <div>{s.tanggal}</div>
              <div className="text-xs text-muted-foreground">{s.jam_mulai} – {s.jam_selesai}</div>
            </TableCell>
            <TableCell>
              <ScheduleStatusBadge status={s.status} />
              {s.cancel_reason && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[140px]">
                  {s.cancel_reason}
                </p>
              )}
            </TableCell>
            {showTutor && (
              <TableCell className="hidden lg:table-cell">
                <span className="font-mono text-xs">{s.tutor_id.slice(0, 8)}…</span>
              </TableCell>
            )}
            <TableCell>
              {s.zoom_join_url ? (
                <a
                  href={s.zoom_join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Video className="h-3 w-3" />
                  Join URL
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {s.zoom_start_url && (
                <a
                  href={s.zoom_start_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-xs text-orange-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Start URL
                </a>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit(s) && (
                    <DropdownMenuItem onClick={() => onEdit(s)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Jadwal
                    </DropdownMenuItem>
                  )}
                  {(s.status === 'scheduled' || s.status === 'berlangsung') && (
                    <DropdownMenuItem
                      onClick={() => handleEnd(s)}
                      disabled={endingId === s.id}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {endingId === s.id ? 'Mengakhiri…' : 'Akhiri Kelas'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onViewAttendance(s)}>
                    <Users className="mr-2 h-4 w-4" /> Lihat Absensi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canEdit(s) && (
                    <DropdownMenuItem onClick={() => onReschedule(s)}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Jadwalkan Ulang
                    </DropdownMenuItem>
                  )}
                  {canEdit(s) && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onCancel(s)}
                    >
                      <CalendarX className="mr-2 h-4 w-4" /> Batalkan Jadwal
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
