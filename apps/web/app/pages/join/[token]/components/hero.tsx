import { DotGrid } from '~/components/decorative/dot-grid';

interface HeroProps {
  coverImage?: string | null;
  title?: string;
  badge?: React.ReactNode;
}

export function Hero({ coverImage, title, badge }: HeroProps) {
  return (
    <div className="relative h-56 w-full shrink-0 overflow-hidden sm:h-72">
      {coverImage ? (
        <img
          src={coverImage}
          alt={title ?? ''}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-linear-to-br from-primary/10 to-secondary/10" />
      )}
      <DotGrid
        opacity={coverImage ? 0.1 : 0.06}
        className={coverImage ? 'text-white' : 'text-foreground'}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
      {badge && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          {badge}
        </div>
      )}
    </div>
  );
}
