import { useTranslation } from 'react-i18next';
import { Badge } from '~/components/ui/badge';
import { STATUS_META } from '~/lib/event-state-machine';

interface EventStatusBadgeProps {
  status: string;
  className?: string;
}

export function EventStatusBadge({ status, className = '' }: EventStatusBadgeProps) {
  const { t } = useTranslation('common');
  
  return (
    <Badge
      className={`text-xs ${STATUS_META[status as keyof typeof STATUS_META]?.colorClass ?? ''} ${className}`}
    >
      {t(`status.${status}`)}
    </Badge>
  );
}
