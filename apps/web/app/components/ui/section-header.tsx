interface SectionHeaderProps {
  title: string;
  description?: string;
  count?: number;
  size?: 'sm' | 'default';
  children?: React.ReactNode;
}

export function SectionHeader({ title, description, count, size = 'default', children }: SectionHeaderProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const headingElement = size === 'sm' ? 'h3' : 'h2';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        {headingElement === 'h2' ? (
          <h2 className={`${textSize} font-semibold text-muted-foreground uppercase tracking-wide shrink-0`}>
            {title}
          </h2>
        ) : (
          <h3 className={`${textSize} font-semibold text-muted-foreground uppercase tracking-wide shrink-0`}>
            {title}
          </h3>
        )}
        <div className="flex-1 h-px bg-border" />
        {count !== undefined && (
          <span className={`${textSize} text-muted-foreground shrink-0`}>{count}</span>
        )}
        {children}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
