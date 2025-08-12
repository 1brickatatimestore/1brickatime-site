// src/pages/minifigs-by-theme.tsx
<<<<<<< HEAD
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MinifigCard, { MinifigItem } from "@/components/MinifigCard";
import MinifigStats from "@/components/MinifigStats";

type ApiResp = {
  items: MinifigItem[];
  meta: { total: number; page: number; pageSize: number };
};

type Facet = { theme: string; count: number };
type ThemesResp = { facets: Facet[]; meta: { total: number } };

export default function MinifigsByThemePage() {
  const [items, setItems] = useState<MinifigItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(36);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [themes, setThemes] = useState<Facet[]>([]);
  const [theme, setTheme] = useState<string>("");

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/themes?type=MINIFIG`)
      .then((r) => r.json())
      .then((data: ThemesResp) => {
        if (!alive) return;
        const arr = Array.isArray(data?.facets) ? data.facets : [];
        setThemes(arr);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(theme ? { theme } : {}),
    });
    // Use the basic endpoint; it accepts theme (server-side will filter if implemented)
    fetch(`/api/minifigs-basic?${params.toString()}`)
      .then((r) => r.json())
      .then((data: ApiResp) => {
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.meta?.total || 0));
      })
      .catch(() => {
        if (alive) {
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, limit, theme]);
=======
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useState } from 'react'

type ThemeOpt = { key: string; label: string; count: number }
type Product = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  imageUrl?: string
}

type PageProps = {
  total: number
  page: number
  limit: number
  inStock: boolean
  theme: string | null
  options: ThemeOpt[]
  items: Product[]
}

function buildBaseUrl(reqHost?: string) {
  // SSR-safe base URL
  return reqHost ? `http://${reqHost}` : 'http://localhost:3000'
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const host = ctx.req.headers.host || 'localhost:3000'
  const base = buildBaseUrl(host)

  const q = ctx.query || {}
  const page = Number(q.page || 1)
  const limit = Number(q.limit || 36)
  const theme = typeof q.theme === 'string' && q.theme.length ? q.theme : null
  const inStock = q.inStock === '1' || q.inStock === 'true'

  // 1) fetch theme options
  const themeRes = await fetch(`${base}/api/themes`)
  const themeJson = await themeRes.json() as { options?: ThemeOpt[] }
  const options = (themeJson.options || []).slice().sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )
>>>>>>> 03f49cd (Stable: themes page fixed, images good, layout locked)

  // 2) fetch products for this page
  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (theme) params.set('theme', theme)
  if (inStock) params.set('inStock', '1')

  const prodRes = await fetch(`${base}/api/products?${params.toString()}`)
  const prodJson = await prodRes.json() as {
    count?: number
    inventory?: Product[]
  }

  const total = prodJson.count ?? 0
  const items = prodJson.inventory ?? []

  return {
    props: {
      total,
      page,
      limit,
      inStock,
      theme,
      options,
      items,
    },
  }
}

export default function MinifigsByThemePage(props: PageProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<string>(props.theme || '')
  const [limit, setLimit] = useState<number>(props.limit || 36)
  const [inStock, setInStock] = useState<boolean>(props.inStock || false)

  const apply = () => {
    const params = new URLSearchParams()
    if (theme) params.set('theme', theme)
    params.set('limit', String(limit))
    if (inStock) params.set('inStock', '1')
    params.set('page', '1')
    router.push(`/minifigs-by-theme?${params.toString()}`)
  }

  const title = `Minifigs by Theme (${props.total})`

  return (
    <>
      <Head>
<<<<<<< HEAD
<<<<<<< HEAD
        <title>Minifigures by Theme — 1 Brick at a Time</title>
      </Head>

      <main className="wrap">
        <header className="header">
          <div className="left">
            <h1>Minifigures</h1>
            <MinifigStats />
            <p className="muted">
              {theme ? `${theme}` : "All themes"} • page {page} of{" "}
              {Math.max(1, Math.ceil(total / limit))} • {total.toLocaleString()} lots
            </p>
          </div>
          <nav className="tabs">
            <Link className="tab" href="/minifigs">Minifigures</Link>
            <Link className="tab active" href="/minifigs-by-theme">By Theme</Link>
          </nav>
        </header>

        <section className="filters">
          <label>
            Theme
            <select value={theme} onChange={(e) => { setPage(1); setTheme(e.target.value); }}>
              <option value="">All</option>
              {themes.map((t) => (
                <option key={t.theme} value={t.theme}>
                  {t.theme} ({t.count})
=======
        <title>Minifigs by Theme ({num(allCount)})</title>
=======
        <title>{`${title} | 1 Brick at a Time`}</title>
        <meta name="robots" content="noindex" />
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
      </Head>

      <div className="wrap">
        <header className="headRow">
          <h1>{title}</h1>
          <div className="spacer" />
          <Link href="/minifigs" className="allLink">All Minifigs</Link>
        </header>

        <div className="controls">
          <label>
            Theme:&nbsp;
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">All Minifigs</option>
<<<<<<< HEAD

              {grouped.main.length > 0 && (
                <optgroup label="Main themes">
                  {grouped.main.map((o) => (
                    <option key={`m-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {grouped.collectibles.length > 0 && (
                <optgroup label="Collectible Minifigures">
                  {grouped.collectibles.map((o) => (
                    <option key={`c-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {grouped.other.length > 0 && (
                <optgroup label="Other">
                  {grouped.other.map((o) => (
                    <option key={`o-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label>
            Per page:{' '}
            <select name="limit" defaultValue={String(limit)}>
              {[12, 24, 36, 48, 72].map((n) => (
                <option key={n} value={n}>
                  {n}
>>>>>>> 03f49cd (Stable: themes page fixed, images good, layout locked)
=======
              {props.options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label} — {o.count}
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
                </option>
              ))}
            </select>
          </label>
<<<<<<< HEAD
          <label>
            Per page
            <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
              <option value={72}>72</option>
            </select>
          </label>
        </section>

        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <section className="grid">
            {items.map((it) => (
              <MinifigCard key={`${it.id}-${it.itemNo}`} item={it} />
            ))}
          </section>
        )}

        <footer className="pager">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ‹ Prev
          </button>
          <span>
            Page {page} / {pageCount}
          </span>
          <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
            Next ›
          </button>
        </footer>
      </main>

      <style jsx>{`
        .wrap { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 16px; }
        .tabs { display: flex; gap: 8px; }
        .tab { display: inline-flex; align-items: center; height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid #ddd; background: #fafafa; text-decoration: none; }
        .tab.active { border-color: #caa21a; background: #fdf3bf; }
        .muted { color: #666; font-size: 13px; margin: 2px 0; }
        .filters { display: flex; gap: 12px; align-items: center; margin: 10px 0 18px; }
        .filters label { display: grid; gap: 4px; font-size: 12px; color: #444; }
        .filters select { height: 34px; border-radius: 8px; border: 1px solid #ccc; background: #fff; padding: 0 10px; min-width: 180px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
        .pager { display: flex; align-items: center; gap: 10px; margin: 18px 0; }
        .pager button { height: 34px; border-radius: 8px; border: 1px solid #ccc; background: #fff; padding: 0 10px; }
      `}</style>
    </>
  );
=======

          <label>
            &nbsp;&nbsp;Per page:&nbsp;
            <select
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
              <option value="60">60</option>
            </select>
          </label>

          <label className="chk">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            &nbsp;Only in stock
          </label>

          <button onClick={apply} className="applyBtn">Apply</button>
        </div>

        {props.items.length === 0 ? (
          <p className="empty">No items found.</p>
        ) : (
          <div className="grid">
            {props.items.map((p) => (
              <article key={p.inventoryId ?? p._id} className="card">
                <div className="imgBox">
                  {p.imageUrl ? (
                    <>
                      {/* Image is centered and not cropped */}
                      <Image
                        src={p.imageUrl}
                        alt={p.name || p.itemNo || 'Minifig'}
                        fill
                        sizes="(max-width: 900px) 50vw, 240px"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                      />
                    </>
                  ) : (
                    <div className="noImg">No image</div>
                  )}
                </div>
                <div className="meta">
                  <h3 className="name">{p.name || p.itemNo || '—'}</h3>
                  <div className="row">
                    <span className="code">{p.itemNo}</span>
                    <span className="price">
                      {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : '-'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .wrap {
          max-width: 1150px;
          margin: 0 auto;
          padding: 16px 18px 40px;
        }
        .headRow {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 8px;
        }
        h1 {
          font-size: 28px;
          margin: 0;
        }
        .spacer { flex: 1; }
        .allLink {
          color: #1f5376;
          text-decoration: underline;
          font-weight: 600;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 10px 0 18px;
          flex-wrap: wrap;
        }
        .chk {
          display: inline-flex;
          align-items: center;
        }
        .applyBtn {
          border: 1px solid #1f5376;
          background: #1f5376;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
        }
        .empty { margin: 24px 0; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 3px 12px rgba(0,0,0,.04);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .imgBox {
          position: relative;
          width: 100%;
          /* square box to avoid cropping, image uses object-fit: contain */
          padding-top: 100%;
          overflow: hidden;
          background: #f6f6f6;
          border-radius: 8px;
        }
        .noImg {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #777;
          font-size: 14px;
        }
        .meta { display: grid; gap: 8px; }
        .name {
          font-size: 14px;
          line-height: 1.25;
          margin: 0 0 6px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }
        .code {
          color: #6b7280;
          font-size: 12px;
        }
        .price {
          color: #0b5;
          font-weight: 700;
        }
      `}</style>
    </>
  )
<<<<<<< HEAD
}

function Pager({
  page,
  pageCount,
  limit,
  theme,
  stock,
}: {
  page: number
  pageCount: number
  limit: number
  theme: string
  stock: boolean
}) {
  const qp = (n: number) => {
    const u = new URL('http://x/minifigs-by-theme')
    if (theme) u.searchParams.set('theme', theme)
    if (limit) u.searchParams.set('limit', String(limit))
    if (stock) u.searchParams.set('stock', '1')
    u.searchParams.set('page', String(n))
    return u.search
  }
  const prev = Math.max(1, page - 1)
  const next = Math.min(pageCount, page + 1)
  return (
    <>
      <Link href={`/minifigs-by-theme${qp(1)}`} aria-disabled={page === 1}>« First</Link>
      <Link href={`/minifigs-by-theme${qp(prev)}`} aria-disabled={page === 1}>‹ Prev</Link>
      <Link href={`/minifigs-by-theme${qp(next)}`} aria-disabled={page === pageCount}>Next ›</Link>
      <Link href={`/minifigs-by-theme${qp(pageCount)}`} aria-disabled={page === pageCount}>Last »</Link>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { query } = ctx
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.max(1, parseInt(String(query.limit || '36'), 10) || 36)
  const onlyInStock = String(query.stock || '') === '1'
  const currentTheme = String(query.theme || '')

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`

  const getJson = async (url: string) => {
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      return await r.json()
    } catch {
      return null
    }
  }

  // themes
  const themesJson = await getJson(`${base}/api/themes`)
  let options: any[] = []
  let allCount = 0

  if (themesJson) {
    if (Array.isArray(themesJson.options)) options = themesJson.options
    else if (Array.isArray(themesJson)) options = themesJson

    if (typeof themesJson?.allCount === 'number') allCount = themesJson.allCount
    else if (typeof themesJson?.total === 'number') allCount = themesJson.total
    else if (typeof themesJson?.count === 'number') allCount = themesJson.count
  }

  const ensure = (val: string, label: string, group: Exclude<GroupKey, null>) => {
    if (!options.find((o) => o.value === val)) {
      options.push({ value: val, label, group, count: null })
    }
  }
  ensure('', 'All Minifigs', 'main')
  ensure('collectibles', 'Collectible Minifigures', 'collectibles')
  ensure('other', 'Other (Singles)', 'other')

  // products
  const qs = new URLSearchParams()
  qs.set('type', 'MINIFIG')
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (onlyInStock) qs.set('stock', '1')
  if (currentTheme) qs.set('theme', currentTheme)

  const prodsJson = await getJson(`${base}/api/products?${qs.toString()}`)
  const items: Product[] =
    prodsJson?.items || prodsJson?.products || prodsJson?.data || []
  const total =
    typeof prodsJson?.total === 'number'
      ? prodsJson.total
      : Array.isArray(items)
      ? items.length
      : 0

  if (!allCount) {
    if (!currentTheme && typeof prodsJson?.grandTotal === 'number') allCount = prodsJson.grandTotal
    else if (!currentTheme) allCount = total
  }

  // **Normalize options so NO property is undefined**
  const normalizedOptions: ThemeOpt[] = (options || []).map((o) => {
    const g: GroupKey =
      typeof o.group === 'string'
        ? (o.group as GroupKey)
        : o.value === 'other'
        ? 'other'
        : null
    return {
      value: String(o.value ?? ''),
      label: String(o.label ?? '').trim(),
      count: typeof o.count === 'number' ? o.count : null, // <-- null, not undefined
      group: g,                                           // <-- null allowed
    }
  })

  return {
    props: {
      items,
      total,
      page,
      limit,
      onlyInStock,
      options: normalizedOptions,
      currentTheme,
      allCount,
    },
  }
>>>>>>> 03f49cd (Stable: themes page fixed, images good, layout locked)
=======
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
}