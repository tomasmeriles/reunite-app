import { useState } from 'react';

export interface ImageWithFallbackProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image URL. Renders fallback when null, undefined, or empty string. */
  src?: string | null;
  /** Rendered when src is absent or the image fails to load. */
  fallback: React.ReactNode;
}

/**
 * Drop-in <img> replacement that renders `fallback` when:
 * - `src` is null, undefined, or empty
 * - The image URL returns an error (404, network failure, etc.)
 */
export function ImageWithFallback({
  src,
  fallback,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...props}
      src={src}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
    />
  );
}
