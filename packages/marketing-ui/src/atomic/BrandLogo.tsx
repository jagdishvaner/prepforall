"use client";

import { useState } from "react";

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
  const [failed, setFailed] = useState(false);

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ minWidth: width, minHeight: height }}>
      {failed ? (
        <span className="whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
          {alt}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
