import type { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DokumenFields({ control }: { control: Control<any> }) {
  return (
    <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Detail Dokumen
      </p>

      <FormField control={control} name="file_url" render={({ field }) => (
        <FormItem>
          <FormLabel>URL File</FormLabel>
          <FormControl>
            <Input placeholder="https://storage.supabase.co/..." {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="file_type" render={({ field }) => (
        <FormItem>
          <FormLabel>Tipe File</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe file" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="ppt">PowerPoint (PPT)</SelectItem>
              <SelectItem value="docx">Word (DOCX)</SelectItem>
              <SelectItem value="epub">ePub</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="bisa_download" render={({ field }) => (
        <FormItem className="flex items-center justify-between">
          <div>
            <FormLabel className="text-sm">Bisa Download</FormLabel>
            <p className="text-xs text-muted-foreground">
              Siswa dapat mengunduh file ini
            </p>
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />
    </div>
  );
}
