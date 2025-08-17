// src/pages/minifigs.tsx
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

// ───────────────── Types ─────────────────
type Minifig = {
  _id?: string;
  id?: string;
  itemNo?: string;
  name: string;
  theme?: string;
  price?: number;
  priceCents?: number;
  imageUrl?: string;
  stock?: number;
};

type Facet = { theme: string; count: number };

type ApiResult = {
  items: Minifig[];
  meta: { total: number; page: number; limit: number };
  facets: Facet[];
};

// ─────────────── Helpers (inline to avoid extra imports) ───────────────
function baseUrlFromEnv() {
  const pub = process.env.NEXT_PUBLIC_SITE_URL;
  const srv = process.env.SITE_URL;
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  return (pub || srv || vercel || "http://localhost:3000").replace(/\/+$/, "");
}

function qs(obj: Record<string, any>) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  });
  return params.toString();
}

function currencyFormatter(code = process. PAYPAL_CLIENT_SECRET_REDACTED|| "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: code });
}

// ───────────────── SSR ─────────────────
export const getServerSideProps: GetServerSideProps<{
  initial: ApiResult;
  q: string;
  theme: string;
  inStock: string;
  page: number;
  limit: number;
  sort: string;
  error?: string;
}> = async (ctx) => {
  const q = (ctx.query.q as string) || "";
  const theme = (ctx.query.theme as string) || "";
  const inStock = (ctx.query.inStock as string) ?? "1";
  const page = Number(ctx.query.page || 1);
  const limit = Number(ctx.query.limit || 36);
  const sort = (ctx.query.sort as string) || "newest";

  const base = baseUrlFromEnv();
  const url = `${base}/api/minifigs?${qs({ q, theme, inStock, page, limit, sort })}`;

  try {
    const res = await fetch(url, { headers: { "x-ssr": "1" } });
    if (!res.ok) {
      const text = await res.text();
      return {
        props: {
          initial: { items: [], meta: { total: 0, page, limit }, facets: [] },
          q, theme, inStock, page, limit, sort,
          error: `API ${res.status}: ${text.slice(0, 200)}`
        }
      };
    }
    const data: ApiResult = await res.json();
    return { props: { initial: data, q, theme, inStock, page, limit, sort } };
  } catch (e: any) {
    return {
      props: {
        initial: { items: [], meta: { total: 0, page, limit }, facets: [] },
        q, theme, inStock, page, limit, sort,
        error: e?.message || "Fetch failed"
      }
    };
  }
};

// ───────────────── Page ─────────────────
const MinifigsPage: NextPage<Awaited<ReturnType<typeof getServerSideProps>>["props"]> = ({
  initial,
  q,
  theme,
  inStock,
  page,
  limit,
  sort,
  error
}) => {
  const router = useRouter();
  const fmt = useMemo(() => currencyFormatter(), []);
  const [search, setSearch] = useState(q);

  const total = initial.meta?.total ?? 0;
  const currentPage = initial.meta?.page ?? page ?? 1;
  const perPage = initial.meta?.limit ?? limit ?? 36;
  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));

  function pushQuery(next: Partial<Record<string, any>>) {
    const merged = {
      q: search,
      theme,
      inStock,
      page: currentPage,
      limit: perPage,
      sort,
      ...next
    };
    // Reset to page 1 on any filtering/search change unless explicitly provided
    if (next.q !== undefined || next.theme !== undefined || next.inStock !== undefined || next.sort !== undefined) {
      merged.page = 1;
    }
    router.push({ pathname: "/minifigs", query: merged }, undefined, { shallow: false });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushQuery({ q: search });
  }

  const onTheme = (val: string) => pushQuery({ theme: val });
  const onStock = (checked: boolean) => pushQuery({ inStock: checked ? "1" : "0" });
  const onSort = (val: string) => pushQuery({ sort: val });
  const onPage = (p: number) => pushQuery({ page: Math.min(Math.max(1, p), totalPages) });

  return (
    <>
      <Head>
        <title>Minifigs — 1 Brick at a Time</title>
        <meta name="description" content="Browse minifigs by theme, availability and price." />
      </Head>

      <main className="minifigs-page" style={{ padding: "16px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0, marginRight: "auto" }}>Minifigs</h1>

          {/* Search */}
          <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="search"
              placeholder="Search name or item number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 10px", minWidth: 240, border: "1px solid #ccc", borderRadius: 8 }}
            />
            <button type="submit" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #888", background: "#f6f6f6", cursor: "pointer" }}>
              Search
            </button>
          </form>

          {/* In stock */}
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={inStock !== "0"}
              onChange={(e) => onStock(e.target.checked)}
            />
            In stock only
          </label>

          {/* Sort */}
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>Sort</span>
            <select value={sort} onChange={(e) => onSort(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ccc" }}>
              <option value="newest">Newest</option>
              <option value="name">Name A–Z</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </label>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
          {/* Facets / Filters */}
          <aside aria-label="Themes" style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Theme</div>
            <select
              value={theme}
              onChange={(e) => onTheme(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }}
            >
              <option value="">All themes</option>
              {initial.facets?.map((f) => (
                <option key={f.theme || "Unknown"} value={f.theme}>
                  {f.theme || "Unknown"} ({f.count})
                </option>
              ))}
            </select>
          </aside>

          {/* Results */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: "#666" }}>
                {total} item{total === 1 ? "" : "s"}
                {theme ? ` • ${theme}` : ""}
                {q ? ` • “${q}”` : ""}
              </div>
              {/* Pagination top */}
              <Pager
                page={currentPage}
                totalPages={totalPages}
                onPrev={() => onPage(currentPage - 1)}
                onNext={() => onPage(currentPage + 1)}
              />
            </div>

            {/* Grid */}
            {initial.items?.length ? (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 16
                }}
              >
                {initial.items.map((it) => (
                  <li key={(it._id as any) ?? it.itemNo ?? it.name} style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
                    <Link
                      href={{
                        pathname: "/minifig/[id]",
                        query: { id: it.itemNo ?? it._id ?? it.id }
                      }}
                      style={{ display: "block", textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "#fafafa" }}>
                        {it.imageUrl ? (
                          <Image
                            src={it.imageUrl}
                            alt={it.name}
                            fill
                            sizes="180px"
                            style={{ objectFit: "contain" }}
                            unoptimized
                          />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#aaa", fontSize: 12 }}>
                            No image
                          </div>
                        )}
                      </div>

                      <div style={{ padding: 10, display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{it.itemNo}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: 700 }}>
                            {fmt.format((it.priceCents ?? Math.round((it.price || 0) * 100)) / 100)}
                          </div>
                          <div style={{ fontSize: 12, color: (it.stock ?? 0) > 0 ? "#0a0" : "#a00" }}>
                            {(it.stock ?? 0) > 0 ? `${it.stock} in stock` : "Out of stock"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#666", border: "1px dashed #ddd", borderRadius: 12 }}>
                No results. Try clearing filters or changing the search.
              </div>
            )}

            {/* Pagination bottom */}
            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <Pager
                  page={currentPage}
                  totalPages={totalPages}
                  onPrev={() => onPage(currentPage - 1)}
                  onNext={() => onPage(currentPage + 1)}
                />
              </div>
            )}

            {error && (
              <pre style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#fff8f8", border: "1px solid #f2dada", color: "#a00", overflowX: "auto" }}>
                {error}
              </pre>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default MinifigsPage;

// ───────────────── Small UI bits ─────────────────
function Pager({
  page,
  totalPages,
  onPrev,
  onNext
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", background: "#f6f6f6", cursor: page <= 1 ? "not-allowed" : "pointer" }}
      >
        ‹ Prev
      </button>
      <span style={{ minWidth: 90, textAlign: "center", color: "#555" }}>
        Page {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", background: "#f6f6f6", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
      >
        Next ›
      </button>
    </div>
  );
}