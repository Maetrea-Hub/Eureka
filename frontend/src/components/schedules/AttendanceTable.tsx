import { useEffect, useState } from 'react';
import { schedulesApi, type Attendance, ATTENDANCE_LABEL, ATTENDANCE_COLOR } from '@/lib/schedules-api';
import { extractApiError } from '@/lib/errors';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
  scheduleId:    string | null;
  scheduleTitle: string;
  onClose:       () => void;
}

export function AttendanceTable({ scheduleId, scheduleTitle, onClose }: Props) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) return;
    setIsLoading(true);
    setError(null);
    schedulesApi.getAttendances(scheduleId)
      .then(setAttendances)
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setIsLoading(false));
  }, [scheduleId]);

  return (
    <Dialog open={!!scheduleId} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Absensi Kelas</DialogTitle>
          <DialogDescription>{scheduleTitle}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !attendances.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data absensi untuk jadwal ini
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Siswa ID</TableHead>
                <TableHead>Waktu Join</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Toleransi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{a.siswa_id.slice(0, 8)}…</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.join_time
                      ? new Date(a.join_time).toLocaleTimeString('id-ID', {
                          hour: '2-digit', minute: '2-digit',
                        })
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${ATTENDANCE_COLOR[a.status]}`}
                      variant="outline"
                    >
                      {ATTENDANCE_LABEL[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.late_tolerance_minutes} menit
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
