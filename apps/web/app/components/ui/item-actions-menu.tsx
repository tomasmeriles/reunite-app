import { MoreHorizontalIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export interface ActionItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  onClick: (e: React.MouseEvent) => void;
}

interface ItemActionsMenuProps {
  actions: ActionItem[];
  className?: string;
}

export function ItemActionsMenu({ actions, className }: ItemActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          size="icon-sm"
          variant="ghost"
          className={cn(
            'cursor-pointer rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white',
            className,
          )}
          aria-label="Actions"
        >
          <MoreHorizontalIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            className={action.variant === 'destructive' ? 'text-destructive!' : undefined}
          >
            {action.icon && <action.icon className="size-4 text-current" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
