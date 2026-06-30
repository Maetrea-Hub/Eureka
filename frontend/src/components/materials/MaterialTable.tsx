import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  materialsApi, MAPEL_LABEL, TIPE_LABEL,
  type Material, type MaterialStatus,
} from '@/lib/materials-api';
import { extractApiError } from '@/lib/errors';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MaterialStatusBadge } from './MaterialStatusBadge';

interface Props {
  materials: Material[];
  isLoading: boolean;
  onEdit:    (m: Material) => void;
  onDelete:  (m: Material) => void;
  onRefetch: () => void;
  showTutor?: boolean; // Admin mode: show tutor_id column
}

export function MaterialTable({
  materials, isLoading, onEdit, onDelete, onRefetch, showTutor = false,
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(material: Material, status: MaterialStatus) {
    setUpdatingId(material.id);
    try {
      await materialsApi.updateStatus(material.id, status);
      onRefetch();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center">
        <p className="font-medium">Belum ada materi</p>
        <p className="mt-1 text-sm text-muted-foreground">Klik "Tambah" untuk membuat materi baru</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judul</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Jenjang</TableHead>
            <TableHead>Mapel</TableHead>
            <TableHead>Topik</TableHead>
            {showTutor && <TableHead>Tutor ID</TableHead>}
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="max-w-[200px]">
                <p className="truncate font-medium">{m.judul}</p>
              </TableCell>

              <TableCell>
                <Badge variant="secondary">{TIPE_LABEL[m.tipe]}</Badge>
              </TableCell>

              <TableCell>
                <Badge variant="outline">{m.jenjang}</Badge>
              </TableCell>

              <TableCell className="text-sm">
                {MAPEL_LABEL[m.mata_pelajaran]}
              </TableCell>

              <TableCell className="max-w-[150px]">
                <p className="truncate text-sm text-muted-foreground">{m.topik}</p>
              </TableCell>

              {showTutor && (
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {m.tutor_id.slice(0, 8)}…
                </TableCell>
              )}

              <TableCell className="text-center">
                <Select
                  value={m.status}
                  disabled={updatingId === m.id}
                  onValueChange={(v) => handleStatusChange(m, v as MaterialStatus)}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue>
                      <MaterialStatusBadge status={m.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
