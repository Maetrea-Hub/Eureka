import type { LucideIcon } from 'lucide-react';

interface Props {
  message: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({ message, description, icon: Icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted-foreground/40" />}
      <p className="font-medium">{message}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
