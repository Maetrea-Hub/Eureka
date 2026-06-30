import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MATA_PELAJARAN_LIST, MAPEL_LABEL, type MataPelajaran } from '@/lib/programs-api';
import type { ControllerRenderProps } from 'react-hook-form';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any, any>;
}

export function MataPelajaranField({ field }: Props) {
  const selected: MataPelajaran[] = field.value ?? [];

  function toggle(mapel: MataPelajaran) {
    const next = selected.includes(mapel)
      ? selected.filter((m) => m !== mapel)
      : [...selected, mapel];
    field.onChange(next);
  }

  return (
    <FormItem>
      <FormLabel>Mata Pelajaran</FormLabel>
      <FormControl>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {MATA_PELAJARAN_LIST.map((mapel) => (
            <label
              key={mapel}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary"
            >
              <Checkbox
                checked={selected.includes(mapel)}
                onCheckedChange={() => toggle(mapel)}
              />
              {MAPEL_LABEL[mapel]}
            </label>
          ))}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
