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
import { useMemo } from 'react'

type ThemeOpt = { key: string; label: string; count: number }
type Item = {
  _id?: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  imageUrl?: string | null
  qty?: number | null
}

type Props = {
  options: ThemeOpt[]
  totalCount: number
  selected: string | null
  items: Item[]
  page: number
  limit: number
  countForQuery: number
}

function absoluteBaseURL(reqHeaders: Record<string, any>) {
  const host = (reqHeaders['x-forwarded-host'] || reqHeaders['host'] || '').toString()
  const proto = (reqHeaders['x-forwarded-proto'] || 'http').toString()
  return `${proto}://${host || 'localhost:3000'}`
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { req, query } = ctx
  const base = absoluteBaseURL(req.headers as any)

  const themeParam = (Array.isArray(query.theme) ? query.theme[0] : query.theme) || ''
  const limit = Math.max(1, Math.min(96, parseInt((query.limit as string) || '36', 10) || 36))
  const page  = Math.max(1, parseInt((query.page as string) || '1', 10) || 1)

<<<<<<< HEAD
  // 1) fetch theme options
  const themeRes = await fetch(`${base}/api/themes`)
  const themeJson = await themeRes.json() as { options?: ThemeOpt[] }
  const options = (themeJson.options || []).slice().sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )
>>>>>>> 03f49cd (Stable: themes page fixed, images good, layout locked)
=======
  // 1) Fetch themes list
  const themesRes = await fetch(`${base}/api/themes`)
  const themesJson = await themesRes.json().catch(() => ({} as any))
  const rawOptions: ThemeOpt[] = Array.isArray((themesJson as any).options)
    ? (themesJson as any).options as ThemeOpt[]
    : []
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)

  // Alphabetize by label
  const options = [...rawOptions].sort((a, b) => a.label.localeCompare(b.label))

  // 2) Fetch total MINIFIG count (for the header)
  const totalRes = await fetch(`${base}/api/products?type=MINIFIG&limit=1&page=1`)
  const totalJson = await totalRes.json().catch(() => ({} as any))
  const totalCount = typeof totalJson.count === 'number' ? totalJson.count : 0

  // 3) Fetch items for selected theme (or all if none)
  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('limit', String(limit))
  params.set('page', String(page))
  if (themeParam) params.set('theme', String(themeParam))

  const itemsRes = await fetch(`${base}/api/products?${params.toString()}`)
  const itemsJson = await itemsRes.json().catch(() => ({} as any))
  const items: Item[] = Array.isArray(itemsJson.inventory) ? itemsJson.inventory : []
  const countForQuery: number = typeof itemsJson.count === 'number' ? itemsJson.count : items.length

  return {
    props: {
      options,
      totalCount,
      selected: themeParam ? String(themeParam) : null,
      items,
      page,
      limit,
      countForQuery,
    },
  }
}

export default function MinifigsByThemePage(props: Props) {
  const { options, totalCount, selected, items, page, limit, countForQuery } = props
  const router = useRouter()

  // Nice label for current theme
  const currentLabel = useMemo(() => {
    if (!selected) return 'All Themes'
    const hit = options.find(o => o.key === selected)
    return hit ? hit.label : selected
  }, [selected, options])

  // Build dropdown options
  const themeOptions = useMemo(() => {
    return [{ key: '', label: 'All Themes', count: totalCount }, ...options]
  }, [options, totalCount])

  const onThemeChange = (val: string) => {
    const q: Record<string, string> = { limit: String(limit), page: '1' }
    if (val) q.theme = val
    router.push({ pathname: '/minifigs-by-theme', query: q }, undefined, { shallow: false })
  }

  const totalPages = Math.max(1, Math.ceil((countForQuery || 0) / limit))
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <>
      <Head>
<<<<<<< HEAD
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
=======
        <title>{`Minifigs by Theme (${totalCount})`}</title>
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
        <meta name="robots" content="noindex" />
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
      </Head>

<<<<<<< HEAD
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
=======
      <main className="wrap">
        {/* Header row with title + theme selector */}
        <div className="topbar">
          <h1>
            Minifigs by Theme <span className="muted">({totalCount})</span>
          </h1>
          <div className="controls">
            <label className="lbl" htmlFor="themeSel">Theme</label>
            <select
              id="themeSel"
              value={selected || ''}
              onChange={(e) => onThemeChange(e.target.value)}
            >
              {themeOptions.map(o => (
                <option key={o.key || 'ALL'} value={o.key}>
                  {o.label} {typeof o.count === 'number' ? `(${o.count})` : ''}
                </option>
              ))}
            </select>
          </div>
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
        </div>

        {/* Results info */}
        <div className="metaRow">
          <div className="crumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <strong>{currentLabel}</strong>
          </div>
          <div className="count">{countForQuery} result{countForQuery === 1 ? '' : 's'}</div>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="empty">No items found.</div>
        ) : (
          <div className="grid">
            {items.map((p) => (
              <article key={p.inventoryId ?? p._id ?? Math.random()} className="card">
                <div className="imgBox">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name || p.itemNo || 'Minifig'}
                      fill
                      sizes="(max-width: 900px) 50vw, 240px"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="noImg">No image</div>
                  )}
                </div>
                <h3 className="name">{p.name || p.itemNo || 'Minifig'}</h3>
                <div className="meta">
                  {p.price != null ? <span className="price">${p.price}</span> : <span className="price">—</span>}
                  {p.qty != null ? <span className="qty">Qty: {p.qty}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pager">
            <button
              disabled={prevDisabled}
              onClick={() =>
                router.push(
                  { pathname: '/minifigs-by-theme', query: { theme: selected || '', limit, page: page - 1 } },
                  undefined,
                  { shallow: false }
                )
              }
            >
              ← Prev
            </button>
            <span className="pg">{page} / {totalPages}</span>
            <button
              disabled={nextDisabled}
              onClick={() =>
                router.push(
                  { pathname: '/minifigs-by-theme', query: { theme: selected || '', limit, page: page + 1 } },
                  undefined,
                  { shallow: false }
                )
              }
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 24px 40px;
        }
        .topbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 20px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
          color: #1f1f1f;
        }
        .muted { color: #5a5a5a; font-weight: 600; }
        .controls { display: flex; align-items: center; gap: 10px; }
        .lbl { font-weight: 600; color: #2b2b2b; }
        select {
          padding: 6px 10px;
          border: 1px solid #c7c7c7;
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          min-width: 220px;
        }

        .metaRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 6px 0 16px;
          color: #3a3a3a;
          font-size: 14px;
        }
        .crumbs { display: flex; align-items: center; gap: 8px; }
        .crumbs :global(a){ color: #1f5376; }
        .count { color: #555; }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 780px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        .card {
          background: #fff;
          border: 1px solid #e7e2d9;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .imgBox {
          position: relative;
          width: 100%;
          height: 220px;             /* fixed box height */
          background: #faf8f4;
          border-radius: 10px;
          overflow: hidden;          /* keeps the image within the box */
        }
        .noImg {
          height: 100%;
          display: grid;
          place-items: center;
          color: #8a8a8a;
          font-size: 13px;
        }
        .name {
          margin: 8px 0 6px;
          font-size: 14px;
          line-height: 1.25;
          color: #222;
          min-height: 36px;
        }
        .meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
        }
        .price { font-weight: 700; color: #1a1a1a; }
        .qty { color: #666; }

        .pager {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-top: 18px;
        }
        .pager button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #d2cfc8;
          background: #fff;
        }
        .pager button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pg { color: #444; font-weight: 600; }
        .empty {
          margin: 20px 0;
          color: #666;
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