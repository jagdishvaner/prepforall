/* eslint-disable @next/next/no-img-element */

export interface BrandLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BrandLogo({
  src,
  alt,
  width = 120,
  height = 48,
  className = "",
}: BrandLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
}
