// components/MinifigCard.tsx
import React from 'react';

type Minifig = {
  no: string;
  name: string;
  img_url: string;
};

export default function MinifigCard({ minifig }: { minifig: Minifig }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <img src={minifig.img_url} alt={minifig.name} className="mb-2" />
      <div className="font-semibold">{minifig.name}</div>
    </div>
  );
}