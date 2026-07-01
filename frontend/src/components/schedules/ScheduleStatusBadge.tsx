import { Badge } from '@/components/ui/badge';
import { STATUS_LABEL, STATUS_COLOR, type ScheduleStatus } from '@/lib/schedules-api';

export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <Badge className={`text-xs font-medium ${STATUS_COLOR[status]}`} variant="outline">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
