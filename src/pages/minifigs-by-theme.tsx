import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useRef } from 'react'
import { useCart } from '@/context/CartContext'

type Item = {
  _id?: string
  inventoryId?: number
  name?: string
  itemNo?: string
  price?: number
  condition?: string
  imageUrl?: string
}

type Opt = { key: string; label: string; count: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  onlyInStock: boolean
  theme: string
  series: string
  themeOptions: Opt[]
  seriesOptions: Opt[] // CMF series if present
}

const COLLECTIBLES_KEY = 'collectible-minifigures'

export default function MinifigsByThemePage(props: Props) {
  const {
    items, count, page, limit, q, cond, onlyInStock,
    theme, series, themeOptions, seriesOptions
  } = props

  const router = useRouter()
  const { add } = useCart()
  const qRef = useRef<HTMLInputElement>(null)

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const hasItems = Array.isArray(items) && items.length > 0
  const showSeries = theme === COLLECTIBLES_KEY && (seriesOptions?.length ?? 0) > 0

  // Build href for pagination while preserving filters
  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (showSeries && series) p.set('series', series)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (onlyInStock) p.set('onlyInStock', '1')
    return `/minifigs-by-theme?${p.toString()}`
  }

  // Submit handler (enables Enter-to-apply)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const theme = String(fd.get('theme') || '')
    const series = String(fd.get('series') || '')
    const q = String(fd.get('q') || '').trim()
    const cond = String(fd.get('cond') || '')
    const onlyInStock = fd.get('onlyInStock') === '1' || fd.get('onlyInStock') === 'on'

    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (theme === COLLECTIBLES_KEY && series) p.set('series', series)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (onlyInStock) p.set('onlyInStock', '1')
    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const sortedThemes = useMemo(
    () => [...(themeOptions || [])].sort((a, b) => a.label.localeCompare(b.label)),
    [themeOptions]
  )
  const sortedSeries = useMemo(
    () => [...(seriesOptions || [])].sort((a, b) => a.label.localeCompare(b.label)),
    [seriesOptions]
  )

  return (
    <>
      <Head>
        <title>{`Minifigs by Theme — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <select name="theme" defaultValue={theme || ''} className="select">
            <option value="">{`All themes`}</option>
            {sortedThemes.map(t => (
              <option key={t.key} value={t.key}>
                {t.label} {t.count > 0 ? `(${t.count})` : ''}
              </option>
            ))}
          </select>

          {showSeries && (
            <select name="series" defaultValue={series || ''} className="select">
              <option value="">{`All series`}</option>
              {sortedSeries.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label} {s.count > 0 ? `(${s.count})` : ''}
                </option>
              ))}
            </select>
          )}

          <input
            ref={qRef}
            name="q"
            defaultValue={q}
            placeholder="Search name or number…"
            className="text"
          />

          <select name="cond" defaultValue={cond} className="select">
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <label className="check">
            <input
              type="checkbox"
              name="onlyInStock"
              defaultChecked={!!onlyInStock}
              value="1"
            />
            In stock
          </label>

          <button type="submit" className="btnPrimary">Apply</button>
          <Link className="btnGhost" href="/minifigs-by-theme">Clear</Link>

          <span className="meta">
            {count} items • Page {page}/{pages}
          </span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map((p) => (
                <article key={p.inventoryId ?? p._id} className="card">
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

                  <h3 className="name" title={p.name}>
                    {p.name || p.itemNo || 'Minifig'}
                  </h3>

                  <div className="priceRow">
                    <span className="price">
                      ${Number(p.price ?? 0).toFixed(2)} {p.condition ? `• ${p.condition}` : ''}
                    </span>

                    <button
                      className="addBtn"
                      onClick={() =>
                        add({
                          id: p.inventoryId ? String(p.inventoryId) : (p._id as string),
                          name: p.name ?? p.itemNo ?? 'Minifig',
                          price: Number(p.price ?? 0),
                          qty: 1,
                          imageUrl: p.imageUrl,
                        })
                      }
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <Link className="pbtn" href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
                  ← Prev
                </Link>
                <span className="pmeta">Page {page} / {pages}</span>
                <Link className="pbtn" href={buildHref(Math.min(pages, page + 1))} aria-disabled={page >= pages}>
                  Next →
                </Link>
              </nav>
            )}
          </>
        ) : (
          <p className="empty">No items found.</p>
        )}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1200px; }
        .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:6px 0 14px; }
        .text, .select { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; }
        .text { min-width:260px; }
        .check { display:flex; align-items:center; gap:6px; font-size:14px; color:#333; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; }
        .pager { display:flex; gap:12px; align-items:center; justify-content:center; margin:18px 0 6px; }
        .pbtn { border:2px solid #204d69; color:#204d69; padding:6px 12px; border-radius:8px; font-weight:700; }
        .pmeta { color:#333; font-weight:600; }
        .empty { color:#333; font-size:15px; padding:8px 2px; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:14px 16px 110px; } }
      `}</style>
    </>
  )
}

export async function getServerSideProps(ctx: any) {
  const { req, query } = ctx
  const host = req?.headers?.host || 'localhost:3000'
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'http'

  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 72)))
  const q = typeof query.q === 'string' ? query.q : ''
  const cond = typeof query.cond === 'string' ? query.cond : ''
  const theme = typeof query.theme === 'string' ? query.theme : ''
  const series = typeof query.series === 'string' ? query.series : ''
  const onlyInStock =
    query.onlyInStock === '1' || query.onlyInStock === 'true' || query.onlyInStock === 'on'

  // fetch themes (with live counts based on current filters)
  const themeQs = new URLSearchParams()
  themeQs.set('type', 'MINIFIG')
  themeQs.set('onlyInStock', onlyInStock ? '1' : '0')
  if (cond) themeQs.set('cond', cond)
  if (q) themeQs.set('q', q)

  let themeOptions: Opt[] = []
  let seriesOptions: Opt[] = []

  const tRes = await fetch(`${proto}://${host}/api/themes?${themeQs.toString()}`)
  if (tRes.ok) {
    const t = await tRes.json()
    themeOptions = Array.isArray(t.options) ? t.options : []
    seriesOptions = Array.isArray(t.series) ? t.series : []
  }

  // fetch products (respecting selected theme/series)
  const prodQs = new URLSearchParams()
  prodQs.set('type', 'MINIFIG')
  prodQs.set('page', String(page))
  prodQs.set('limit', String(limit))
  if (theme) prodQs.set('theme', theme)
  if (theme === 'collectible-minifigures' && series) prodQs.set('series', series)
  if (q) prodQs.set('q', q)
  if (cond) prodQs.set('cond', cond)
  if (onlyInStock) prodQs.set('onlyInStock', '1')

  let items: Item[] = []
  let count = 0
  const pRes = await fetch(`${proto}://${host}/api/products?${prodQs.toString()}`)
  if (pRes.ok) {
    const data = await pRes.json()
    const arr =
      (Array.isArray(data.items) && data.items) ||
      (Array.isArray(data.inventory) && data.inventory) ||
      (Array.isArray(data.results) && data.results) ||
      []
    items = arr
    count = Number(data.count ?? arr.length ?? 0)
  }

  return {
    props: {
      items, count, page, limit, q, cond, onlyInStock,
      theme, series, themeOptions, seriesOptions
    }
  }
}