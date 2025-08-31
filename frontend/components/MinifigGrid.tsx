// src/components/MinifigGrid.tsx
import React from "react";
import MinifigCard, { Minifig } from "./MinifigCard";

export default function MinifigGrid({ items }: { items: Minifig[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <li key={(m._id ?? m.id ?? m.name).toString()}>
          <MinifigCard m={m} />
        </li>
      ))}
    </ul>
  );
}
