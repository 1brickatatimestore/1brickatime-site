import { useState } from 'react';

type Props = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

const CANDIDATES = [
  '/logo-1brickatime.png', // what your current code was using
  '/logo.png',             // simple default
  '/branding/logo.png'     // older folder layout
];

export default function Logo({ className, width = 160, height = 160, alt = '1 Brick at a Time' }: Props) {
  const [srcIdx, setSrcIdx] = useState(0);
  const src = CANDIDATES[srcIdx] ?? CANDIDATES[0];

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', width, height, objectFit: 'contain' }}
      onError={() => {
        if (srcIdx < CANDIDATES.length - 1) setSrcIdx(srcIdx + 1);
      }}
      loading="lazy"
    />
  );
}