import type { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VideoFields({ control }: { control: Control<any> }) {
  return (
    <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Detail Video
      </p>
      <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Video streaming only — siswa tidak bisa mengunduh materi video.
      </div>

      <FormField control={control} name="video_url" render={({ field }) => (
        <FormItem>
          <FormLabel>URL Video</FormLabel>
          <FormControl>
            <Input placeholder="https://stream.mux.com/... atau Bunny.net URL" {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="duration_seconds" render={({ field }) => (
        <FormItem>
          <FormLabel>Durasi <span className="font-normal text-muted-foreground">(detik, opsional)</span></FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              placeholder="600"
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
