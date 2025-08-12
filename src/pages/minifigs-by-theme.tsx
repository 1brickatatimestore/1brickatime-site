// src/pages/minifigs-by-theme.tsx
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

  // 1) Fetch themes list
  const themesRes = await fetch(`${base}/api/themes`)
  const themesJson = await themesRes.json().catch(() => ({} as any))
  const rawOptions: ThemeOpt[] = Array.isArray((themesJson as any).options)
    ? (themesJson as any).options as ThemeOpt[]
    : []

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
        <title>{`Minifigs by Theme (${totalCount})`}</title>
        <meta name="robots" content="noindex" />
      </Head>

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
}