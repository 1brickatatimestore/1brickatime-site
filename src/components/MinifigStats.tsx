// src/components/MinifigStats.tsx
import { useEffect, useState } from "react";

type Stats = {
  availableLots: number;
  availableItems: number;
  totalLots: number;
  totalItems: number;
};

export default function MinifigStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/minifigs-stats")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data?.ok && data?.stats) setStats(data.stats as Stats);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <p className="muted" style={{ margin: "4px 0 16px 2px" }}>
      <strong>Available:</strong>{" "}
      {stats.availableLots.toLocaleString()} lots •{" "}
      {stats.availableItems.toLocaleString()} items
    </p>
  );
}