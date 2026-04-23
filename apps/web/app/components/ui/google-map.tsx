import { useState } from 'react';
import { cn } from '~/lib/utils';

interface GoogleMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
  className?: string;
}

export function GoogleMap({
  lat,
  lng,
  zoom = 15,
  title = 'Location map',
  className,
}: GoogleMapProps) {
  const [loaded, setLoaded] = useState(false);

  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <iframe
        title={title}
        src={src}
        width="100%"
        height="100%"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className={cn(
          'border-0 w-full h-full transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
