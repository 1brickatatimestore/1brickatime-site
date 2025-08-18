// src/pages/minifigs-by-theme.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useCart } from "@/context/CartContext";

type Item = {
  _id: string;
  id: string;
  itemNo: string;
  name: string;
  remarks?: string;
  inventoryId?: number;
  price: number;
  priceCents: number;
  imageUrl?: string | null;
  stock: number;
  theme?: string;
  collection?: string;
  series?: string;
  condition?: string;
};

type FacetRow = { theme?: string; collection?: string; series?: string; count: number };
type Props = {
  items: Item[];
  meta: { total: number; page: number; limit: number };
  facets: { themes: FacetRow[]; collections: FacetRow[]; series: FacetRow[] };
  queryDefaults: Record<string, string>;
};

export default function MinifigsByThemePage({ items, meta, facets, queryDefaults }: Props) {
  const router = useRouter();
  const { add, getQty } = useCart();

  const pages = Math.max(1, Math.ceil((meta?.total ?? 0) / Math.max(1, meta?.limit ?? 36)));
  const hasItems = items && items.length > 0;

  function push(params: Record<string, string | number | undefined>) {
    const merged = { ...router.query, ...params, page: 1 };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === "" || merged[k] == null) delete (merged as any)[k];
    });
    router.push({ pathname: router.pathname, query: merged }, undefined, { shallow: false });
  }

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams();
    const q = router.query as Record<string, string>;
    p.set("page", String(nextPage));
    p.set("limit", String(meta?.limit ?? 36));
    ["q", "inStock", "theme", "collection", "series", "sort"].forEach((k) => {
      if (q[k]) p.set(k, String(q[k]));
    });
    return `/minifigs-by-theme?${p.toString()}`;
  };

  const themes = useMemo(() => facets.themes?.map(t => ({ label: t.theme!, count: t.count })) ?? [], [facets]);
  const collections = useMemo(() => facets.collections?.map(t => ({ label: t.collection!, count: t.count })) ?? [], [facets]);
  const series = useMemo(() => facets.series?.map(t => ({ label: t.series!, count: t.count })) ?? [], [facets]);

  const qObj = router.query as Record<string, string>;
  const sort = qObj.sort ?? "name";
  const inStock = qObj.inStock ?? "1";

  return (
    <>
      <Head><title>Minifigures — 1 Brick at a Time</title></Head>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); }}>
        <input
          defaultValue={qObj.q ?? ""}
          placeholder="Search name or number…"
          className="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.currentTarget as HTMLInputElement).value;
              push({ q: val });
            }
          }}
        />

        <select defaultValue={inStock} className="select" onChange={(e) => push({ inStock: e.target.value })}>
          <option value="1">Only in stock</option>
          <option value="0">Include out of stock</option>
        </select>

        <select defaultValue={qObj.collection ?? ""} className="select"
                onChange={(e) => push({ collection: e.target.value, series: "" })}>
          <option value="">All collections</option>
          {collections.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>

        <select defaultValue={qObj.series ?? ""} className="select"
                onChange={(e) => push({ series: e.target.value })}
                disabled={(qObj.collection ?? "") !== "Collectible Minifigures"}>
          <option value="">All series</option>
          {series.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>

        <select defaultValue={qObj.theme ?? ""} className="select" onChange={(e) => push({ theme: e.target.value })}>
          <option value="">All themes</option>
          {themes.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>

        <select defaultValue={sort} className="select" onChange={(e) => push({ sort: e.target.value })}>
          <option value="name">Name A–Z</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </form>

      {hasItems ? (
        <>
          <div className="grid">
            {items.map((p) => {
              const id = p.itemNo || p.id || p._id;
              const href = `/minifig/${encodeURIComponent(id)}`;
              const inCart = getQty(id);
              const left = Math.max(0, (p.stock || 0) - inCart);
              const disabled = left <= 0;
              return (
                <article key={id} className="card">
                  <Link href={href} className="imgLink" aria-label={p.name || p.itemNo || "Minifig"}>
                    <div className="imgBox">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name || p.itemNo || "Minifig"}
                          fill
                          sizes="(max-width: 900px) 50vw, 240px"
                          style={{ objectFit: "contain", objectPosition: "center" }}
                        />
                      ) : (
                        <div className="noImg">No image</div>
                      )}
                    </div>
                  </Link>

                  <h3 className="name" title={p.name}>
                    <Link href={href}>{p.name || p.itemNo || "Minifig"}</Link>
                  </h3>

                  <div className="priceRow">
                    <span className="price">${Number(p.price ?? 0).toFixed(2)}</span>
                    <button
                      className="addBtn"
                      disabled={disabled}
                      onClick={() =>
                        !disabled &&
                        add({
                          id,
                          name: p.name ?? p.itemNo ?? "Minifig",
                          price: Number(p.price ?? 0),
                          qty: 1,
                          imageUrl: p.imageUrl ?? null,
                          stock: p.stock,
                        })
                      }
                    >
                      {disabled ? "Sold out" : "Add to cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <Link className="pbtn" href={buildHref(Math.max(1, (meta?.page ?? 1) - 1))} aria-disabled={(meta?.page ?? 1) <= 1}>
                ← Prev
              </Link>
              <span className="pmeta">Page {meta?.page ?? 1} / {pages}</span>
              <Link className="pbtn" href={buildHref(Math.min(pages, (meta?.page ?? 1) + 1))} aria-disabled={(meta?.page ?? 1) >= pages}>
                Next →
              </Link>
            </nav>
          )}
        </>
      ) : (
        <p className="empty">No items found.</p>
      )}

      <style jsx>{`
        .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:6px 0 14px; }
        .text, .select { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; }
        .text { min-width:220px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgLink { display:block; }
        .imgBox { position:relative; width:100%; aspect-ratio:1/1; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .imgBox :global(img){ width:100% !important; height:100% !important; object-fit:contain !important; object-position:center center !important; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a){ color:inherit; text-decoration:none; }
        .name :global(a:hover){ text-decoration:underline; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; }
        .pager { display:flex; gap:12px; align-items:center; justify-content:space-between; margin:18px 0 6px; }
        .pbtn { border:2px solid #204d69; color:#204d69; padding:6px 12px; border-radius:8px; font-weight:700; }
        .pmeta { color:#333; font-weight:600; }
        .empty { color:#333; font-size:15px; padding:8px 2px; }
      `}</style>
    </>
  );
}

export async function getServerSideProps(ctx: any) {
  const { req, query } = ctx;
  const host = req?.headers?.host || "localhost:3000";
  const proto = (req?.headers?.["x-forwarded-proto"] as string) || "http";

  const p = new URLSearchParams();
  p.set("type", "MINIFIG");
  if (query.q) p.set("q", String(query.q));
  p.set("inStock", String(query.inStock ?? "1"));
  if (query.theme) p.set("theme", String(query.theme));
  if (query.collection) p.set("collection", String(query.collection));
  if (query.series) p.set("series", String(query.series));
  p.set("page", String(query.page ?? "1"));
  p.set("limit", String(query.limit ?? "36"));
  p.set("sort", String(query.sort ?? "name"));

  const [itemsRes, facetsRes] = await Promise.all([
    fetch(`${proto}://${host}/api/products?${p.toString()}`),
    fetch(`${proto}://${host}/api/themes?type=MINIFIG`),
  ]);

  let items: Item[] = [];
  let meta = { total: 0, page: 1, limit: 36 };
  let facets = { themes: [], collections: [], series: [] } as any;

  if (itemsRes.ok) {
    const data = await itemsRes.json();
    items = Array.isArray(data.items) ? data.items : [];
    meta = data.meta || meta;
    facets = data.facets || facets;
  }
  if (facetsRes.ok) {
    const d = await facetsRes.json();
    // Prefer API facets; fallback to products facets if themes empty
    if (!Array.isArray(facets.themes) || !facets.themes.length) {
      facets = { themes: d.options || [], collections: d.collections || [], series: d.series || [] };
    }
  }

  return { props: { items, meta, facets, queryDefaults: Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])) } };
}