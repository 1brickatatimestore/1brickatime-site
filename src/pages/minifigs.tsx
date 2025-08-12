// src/pages/minifigs.tsx
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  _id?: string;
  inventoryId?: number;
  name: string;
  price: number;
  imageUrl: string;
  condition?: string; // 'N' | 'U'
  remarks?: string;
  qty?: number;
  itemNo?: string;
  type?: string;
};

type ApiResult = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};

const THEME_KEYWORDS: Record<string, string[]> = {
  'Star Wars': ['star wars', 'sw ', 'skywalker', 'vader', 'stormtrooper', 'r2-d2'],
  'Harry Potter': ['harry potter', 'hogwarts', 'weasley', 'malfoy', 'dumbledore', 'hermione'],
  'Super Heroes': ['super heroes', 'super hero'],
  Marvel: ['marvel', 'avengers', 'spider-man', 'spiderman', 'iron man', 'captain america', 'thor', 'hulk', 'nick fury'],
  DC: ['dc', 'batman', 'joker', 'robin', 'harley', 'superman', 'wonder woman', 'flash', 'dick grayson'],
  City: ['city', 'police', 'firefighter', 'construction'],
  Ninjago: ['ninjago', 'lloyd', 'kai', 'cole', 'zane', 'nya', 'jay'],
  Friends: ['friends', 'heartlake'],
  Technic: ['technic'],
  'Lord of the Rings': ['lord of the rings', 'lotr', 'aragorn', 'gandalf', 'legolas', 'frodo'],
  Disney: ['disney', 'mickey', 'minnie', 'elsa', 'anna', 'moana'],
  'Jurassic World': ['jurassic', 'dinosaur'],
};

function matchesTheme(p: Product, theme?: string) {
  if (!theme) return true;
  const keys = THEME_KEYWORDS[theme];
  if (!keys) return true; // unknown theme → don't filter out
  const hay = `${p.name ?? ''} ${p.remarks ?? ''} ${p.itemNo ?? ''}`.toLowerCase();
  return keys.some((k) => hay.includes(k));
}

export default function MinifigsPage() {
  const router = useRouter();
  const { query } = router;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ApiResult>({ items: [], total: 0, page: 1, pages: 1 });

  // Build query string with safe defaults
  const apiQS = useMemo(() => {
    const u = new URLSearchParams();
    u.set('type', (query.type as string) || 'MINIFIG');
    u.set('page', String(query.page || 1));
    u.set('limit', String(query.limit || 36));
    if (query.onlyInStock) u.set('onlyInStock', '1');
    if (query.condition) u.set('condition', String(query.condition));
    if (query.q) u.set('q', String(query.q));
    return u.toString();
  }, [query]);

  // Robust fetch: try /api/minifigs, then /api/products (first one with items wins)
  useEffect(() => {
    let alive = true;
    setLoading(true);

    const endpoints = [`/api/minifigs?${apiQS}`, `/api/products?${apiQS}`];

    (async () => {
      for (const url of endpoints) {
        try {
          const r = await fetch(url);
          const data = await r.json();

          // Normalize shapes: {items}, {products}, or [] directly
          let items: Product[] = [];
          if (Array.isArray(data?.items)) items = data.items as Product[];
          else if (Array.isArray(data?.products)) items = data.products as Product[];
          else if (Array.isArray(data)) items = data as Product[];

          if (items.length > 0 || url === endpoints[endpoints.length - 1]) {
            if (!alive) return;

            const total = Number(data?.total ?? items.length) || items.length;
            const page = Number(data?.page ?? query.page ?? 1) || 1;
            const pages =
              Number(data?.pages ?? Math.max(1, Math.ceil(total / Number(query.limit || 36)))) || 1;

            setResult({ items, total, page, pages });
            setLoading(false);
            return;
          }
        } catch {
          // try next endpoint
        }
      }

      if (alive) {
        setResult({ items: [], total: 0, page: 1, pages: 1 });
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiQS, query.limit, query.page]);

  const theme = (query.theme as string) || '';
  const filtered: Product[] = useMemo(() => {
    const base = result?.items ?? [];
    if (!theme) return base;
    return base.filter((p) => matchesTheme(p, theme));
  }, [result?.items, theme]);

  // Toolbar submit
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const u = new URLSearchParams();
    u.set('type', 'MINIFIG');
    u.set('page', '1');
    u.set('limit', String(fd.get('limit') || '36'));
    const q = String(fd.get('q') || '');
    if (q) u.set('q', q);
    const cond = String(fd.get('condition') || '');
    if (cond) u.set('condition', cond);
    if (fd.get('stock')) u.set('onlyInStock', '1');
    if (theme) u.set('theme', theme);
    router.push(`/minifigs?${u.toString()}`);
  };

  const reset = () => router.push('/minifigs?type=MINIFIG&page=1&limit=36');

  return (
    <>
      <Head><title>Minifigures</title></Head>

      <div className="wrap">
        <div className="headerRow">
          <h1>Minifigures</h1>
          <Link className="link" href="/minifigs-by-theme">Minifigs by Theme</Link>
        </div>

        <form className="toolbar" onSubmit={apply}>
          <input name="q" placeholder="Name or item no..." defaultValue={(query.q as string) || ''} />
          <select name="condition" defaultValue={(query.condition as string) || ''}>
            <option value="">Any</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>
          <label className="check">
            <input type="checkbox" name="stock" defaultChecked={!!query.onlyInStock} />
            <span>Only in stock</span>
          </label>
          <select name="limit" defaultValue={(query.limit as string) || '36'}>
            <option value="24">24</option>
            <option value="36">36</option>
            <option value="60">60</option>
          </select>
          <button type="submit">Apply</button>
          <button type="button" className="ghost" onClick={reset}>Reset</button>
          {theme && <span className="themeTag">Theme: {theme}</span>}
        </form>

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <>
            <div className="grid">
              {filtered.map((p) => (
                <article key={p.inventoryId ?? p._id ?? p.name} className="card">
                  <div className="imgBox">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 240px"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="meta">
                    <div className="title" title={p.name}>{p.name}</div>
                    <div className="row">
                      <span className="price">${Number(p.price ?? 0).toFixed(2)}</span>
                      {p.condition && <span className="pill">{p.condition === 'N' ? 'New' : 'Used'}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="total">Showing {filtered.length} of {result.total}</p>
          </>
        )}
      </div>

      <style jsx>{`
        .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .headerRow { display:flex; justify-content:space-between; align-items:center; }
        h1 { margin: 0 0 16px; font-size: 28px; }
        .link { color:#ffd969; background:#1f5376; padding:8px 12px; border-radius:8px; }

        .toolbar {
          display: grid;
          grid-template-columns: 1fr 140px 140px 120px 96px 96px auto;
          gap: 10px;
          align-items: center;
          margin: 14px 0 16px;
        }
        .toolbar input[name="q"] {
          padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px;
        }
        .toolbar select { padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; }
        .toolbar .check { display: flex; align-items: center; gap: 8px; }
        .toolbar button {
          padding: 10px 14px; border-radius: 8px; background:#e1b946; border:2px solid #a2801a; font-weight:700; cursor:pointer;
        }
        .toolbar .ghost { background:transparent; border:2px solid #204d69; color:#204d69; }
        .toolbar .themeTag { margin-left: 8px; font-style: italic; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 6px rgba(0,0,0,.08); overflow: hidden; display: flex; flex-direction: column; }
        .imgBox { position: relative; height: 200px; background: #fff; }
        .meta { padding: 10px 12px; }
        .title { font-size: 14px; line-height: 1.3; height: 36px; overflow: hidden; }
        .row { display:flex; justify-content:space-between; align-items:center; margin-top: 6px; }
        .price { font-weight: 700; }
        .pill { padding: 2px 8px; border-radius: 999px; background: #eef3f6; color: #204d69; font-size: 12px; }
        .total { margin-top: 12px; color: #555; }

        @media (max-width: 900px) {
          .toolbar { grid-template-columns: 1fr 120px 120px 110px 84px 84px; }
        }
      `}</style>
    </>
  );
}