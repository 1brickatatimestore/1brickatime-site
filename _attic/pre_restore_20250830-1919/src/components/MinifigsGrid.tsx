// src/components/MinifigsGrid.tsx
import { useEffect, useState } from 'react';

type Minifig = {
  _id: string;
  figNumber: string;
  name: string;
  theme: string;
  priceAUD: number;
  qty: number;
  image?: string;
};

export default function MinifigsGrid({ limit = 24 }: { limit?: number }) {
  const [items, setItems] = useState<Minifig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = new URL('/api/minifigs-live', window.location.origin);
    u.searchParams.set('limit', String(limit));
    fetch(u.toString())
      .then((r) => r.json())
      .then((j) => setItems(j.items ?? []))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return <p>Loading minifigs…</p>;
  if (!items.length) return <p>No minifigs available right now.</p>;

  return (
    <div className="grid">
      {items.map((m) => (
        <a key={m._id} className="card" href={`/minifigs/${encodeURIComponent(m.figNumber)}`}>
          <div className="thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.image || '/placeholder.png'} alt={m.name} loading="lazy" />
          </div>
          <div className="meta">
            <h3>{m.name}</h3>
            <p className="sub">{m.figNumber} • {m.theme}</p>
            <strong>
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(m.priceAUD)}
            </strong>
            <span className="stock">{m.qty} in stock</span>
          </div>
        </a>
      ))}
      <style jsx>{`
        .grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }
        .card {
          display: block;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          background: #fff;
        }
        .thumb {
          aspect-ratio: 1/1;
          display: grid;
          place-items: center;
          background: #fafafa;
        }
        .thumb img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
        }
        .meta {
          padding: .75rem;
        }
        .meta h3 {
          margin: 0 0 .25rem;
          font-size: 0.95rem;
          line-height: 1.2;
        }
        .sub {
          margin: 0 0 .5rem;
          color: #6b7280;
          font-size: .8rem;
        }
        .stock {
          display: inline-block;
          margin-left: .5rem;
          color: #6b7280;
          font-size: .8rem;
        }
      `}</style>
    </div>
  );
}