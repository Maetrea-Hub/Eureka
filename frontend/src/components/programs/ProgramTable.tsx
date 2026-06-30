import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
  programsApi, formatRupiah, TIPE_LABEL, MAPEL_LABEL,
  type Program,
} from '@/lib/programs-api';
import { extractApiError } from '@/lib/errors';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface Props {
  programs:  Program[];
  isLoading: boolean;
  onEdit:    (program: Program) => void;
  onDelete:  (program: Program) => void;
  onRefetch: () => void;
}

export function ProgramTable({ programs, isLoading, onEdit, onDelete, onRefetch }: Props) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleStatus(program: Program) {
    setTogglingId(program.id);
    try {
      await programsApi.toggleStatus(program.id, !program.status);
      onRefetch();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed text-center">
        <p className="font-medium">Belum ada program</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Klik "Tambah Program" untuk membuat program pertama
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Jenjang</TableHead>
            <TableHead>Mata Pelajaran</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead className="text-right">Kapasitas</TableHead>
            <TableHead className="text-right">Tarif</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="font-medium">{program.nama}</TableCell>

              <TableCell>
                <Badge variant="secondary">
                  {TIPE_LABEL[program.tipe_layanan]}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant="outline">{program.jenjang}</Badge>
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {program.mata_pelajaran.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {MAPEL_LABEL[m]}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {program.durasi}
              </TableCell>

              <TableCell className="text-right text-sm">
                {program.kapasitas}
              </TableCell>

              <TableCell className="text-right text-sm font-medium">
                {formatRupiah(program.tarif)}
              </TableCell>

              <TableCell className="text-center">
                <Switch
                  checked={program.status}
                  disabled={togglingId === program.id}
                  onCheckedChange={() => handleToggleStatus(program)}
                />
              </TableCell>

              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(program)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(program)}
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
