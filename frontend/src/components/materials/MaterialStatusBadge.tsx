import { Badge } from '@/components/ui/badge';
import type { MaterialStatus } from '@/lib/materials-api';

const config: Record<MaterialStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft:    { label: 'Draft',     variant: 'secondary' },
  published:{ label: 'Published', variant: 'default'   },
  nonaktif: { label: 'Nonaktif',  variant: 'outline'   },
};

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
