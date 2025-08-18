// src/components/MinifigFilters.tsx
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

type Facet = { theme?: string; collection?: string; series?: string; count: number };
type Props = {
  facets?: { themes?: Facet[]; collections?: Facet[]; series?: Facet[] };
  defaults?: { q?: string; theme?: string; collection?: string; series?: string; inStock?: string; sort?: string };
};

export default function MinifigFilters({ facets, defaults }: Props) {
  const router = useRouter();
  const qObj = router.query as Record<string, string>;

  const [q, setQ] = useState(qObj.q ?? defaults?.q ?? "");
  const [inStock, setInStock] = useState(qObj.inStock ?? defaults?.inStock ?? "1");
  const [theme, setTheme] = useState(qObj.theme ?? defaults?.theme ?? "");
  const [collection, setCollection] = useState(qObj.collection ?? defaults?.collection ?? "");
  const [series, setSeries] = useState(qObj.series ?? defaults?.series ?? "");
  const [sort, setSort] = useState(qObj.sort ?? defaults?.sort ?? "newest");

  const themes = useMemo(() => (facets?.themes || []).map(f => ({ label: f.theme!, count: f.count })), [facets]);
  const collections = useMemo(() => (facets?.collections || []).map(f => ({ label: f.collection!, count: f.count })), [facets]);
  const seriesList = useMemo(() => (facets?.series || []).map(f => ({ label: f.series!, count: f.count })), [facets]);

  function push(params: Record<string, string | number | undefined>) {
    const merged = { ...router.query, ...params, page: 1 };
    Object.keys(merged).forEach(k => {
      if (merged[k] === "" || merged[k] == null) delete (merged as any)[k];
    });
    router.push({ pathname: router.pathname, query: merged }, undefined, { shallow: false });
  }

  return (
    <div className="filters" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", alignItems: "end" }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && push({ q })} placeholder="minifig name, itemNo…" style={{ padding: 8 }} />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>In stock</span>
        <select value={inStock} onChange={(e) => { setInStock(e.target.value); push({ inStock: e.target.value }); }}>
          <option value="1">Only in stock</option>
          <option value="0">Include out of stock</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Collection</span>
        <select value={collection} onChange={(e) => { setCollection(e.target.value); setSeries(""); push({ collection: e.target.value, series: "" }); }}>
          <option value="">All</option>
          {collections.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Series</span>
        <select value={series} onChange={(e) => { setSeries(e.target.value); push({ series: e.target.value }); }} disabled={collection !== "Collectible Minifigures"}>
          <option value="">All</option>
          {seriesList.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Theme</span>
        <select value={theme} onChange={(e) => { setTheme(e.target.value); push({ theme: e.target.value }); }}>
          <option value="">All</option>
          {themes.map(({ label, count }) => (
            <option key={label} value={label}>{label} ({count})</option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Sort</span>
        <select value={sort} onChange={(e) => { setSort(e.target.value); push({ sort: e.target.value }); }}>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </label>

      <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
        <button onClick={() => push({ q })} style={{ padding: "8px 12px" }}>Apply search</button>
      </div>
    </div>
  );
}