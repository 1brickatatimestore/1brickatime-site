import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useMemo } from 'react'
import { useCart } from '@/context/CartContext'

type ThemeOpt = { key: string; label: string; count: number }
type SeriesOpt = { n: number; key: string; label: string; count: number }

type Item = {
  _id?: string
  inventoryId?: number
  name?: string
  itemNo?: string
  price?: number
  condition?: string
  imageUrl?: string
}

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  onlyInStock: boolean
  theme: string
  series?: number | null
  themeOptions: ThemeOpt[]
  seriesOptionsAll: SeriesOpt[]
}

const CMF_KEY = 'collectible-minifigures'

export default function MinifigsByThemePage(props: Props) {
  const {
    items, count, page, limit, q, cond, onlyInStock, theme, series,
    themeOptions, seriesOptionsAll
  } = props

  const router = useRouter()
  const { add } = useCart()
  const qRef = useRef<HTMLInputElement>(null)

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const isCMF = theme === CMF_KEY

  const seriesOptions = useMemo(
    () => (isCMF ? seriesOptionsAll : []),
    [isCMF, seriesOptionsAll]
  )

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (onlyInStock) p.set('stock', '1')
    if (theme) p.set('theme', theme)
    if (isCMF && series) p.set('series', String(series))
    return `/minifigs-by-theme?${p.toString()}`
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nextQ = String(fd.get('q') || '').trim()
    const nextCond = String(fd.get('cond') || '')
    const nextLimit = Number(fd.get('limit') || limit) || limit
    const nextTheme = String(fd.get('theme') || '')
    const nextSeries = isCMF ? String(fd.get('series') || '') : ''
    const nextStock = fd.get('stock') ? '1' : ''

    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(nextLimit))
    if (nextQ) p.set('q', nextQ)
    if (nextCond) p.set('cond', nextCond)
    if (nextStock) p.set('stock', '1')
    if (nextTheme) p.set('theme', nextTheme)
    if (nextTheme === CMF_KEY && nextSeries) p.set('series', nextSeries)
    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const hasItems = Array.isArray(items) && items.length > 0

  return (
    <>
      <Head>
        <title>{`Minifigs by Theme — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <label className="sr">Theme</label>
          <select name="theme" defaultValue={theme || ''} className="select">
            <option value="">{`All themes${count ? '' : ''}`}</option>
            {themeOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.count})
              </option>
            ))}
          </select>

          {isCMF && (
            <select name="series" defaultValue={series ?? ''} className="select">
              <option value="">{`All series`}</option>
              {seriesOptions.map(s => (
                <option key={s.key} value={s.n}>
                  {s.label} ({s.count})
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

          <select name="limit" defaultValue={String(limit)} className="select">
            {[12, 24, 36, 48, 72].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <label className="chk">
            <input type="checkbox" name="stock" defaultChecked={onlyInStock} /> Only in stock
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
                  <Link href={`/minifig/${p.inventoryId ?? p._id}`} className="imgBox" aria-label="Details">
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
                  </Link>

                  <h3 className="name" title={p.name}>
                    <Link href={`/minifig/${p.inventoryId ?? p._id}`}>
                      {p.name || p.itemNo || 'Minifig'}
                    </Link>
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
        .sr { position:absolute; left:-9999px; }
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1200px; }
        .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:6px 0 14px; }
        .text, .select { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; }
        .text { min-width:220px; }
        .chk { display:flex; gap:6px; align-items:center; font-size:14px; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; display:block; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:8px 0 6px; min-height:34px; color:#1e1e1e; }
        .name a { text-decoration:none; color:inherit; }
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

  const page  = Math.max(1, Number(query.page ?? 1))
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 36)))
  const q     = typeof query.q === 'string' ? query.q : ''
  const cond  = typeof query.cond === 'string' ? query.cond : ''
  const onlyInStock = query.stock === '1' || query.stock === 'true'
  const theme = typeof query.theme === 'string' ? query.theme : ''
  const series = typeof query.series === 'string' && query.series ? Number(query.series) : null

  // Fetch items
  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (q) params.set('q', q)
  if (cond) params.set('cond', cond)
  if (onlyInStock) params.set('stock', '1')
  if (theme) params.set('theme', theme)
  if (theme === 'collectible-minifigures' && series) params.set('series', String(series))

  let items: Item[] = []
  let count = 0

  {
    const r = await fetch(`${proto}://${host}/api/products?${params.toString()}`)
    if (r.ok) {
      const data = await r.json()
      const arr =
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.inventory) && data.inventory) ||
        (Array.isArray(data.results) && data.results) ||
        []
      items = arr
      count = Number(data.count ?? arr.length ?? 0)
    }
  }

  // Fetch live theme + series counts that match current filters
  const themesParams = new URLSearchParams()
  themesParams.set('type', 'MINIFIG')
  if (q) themesParams.set('q', q)
  if (cond) themesParams.set('cond', cond)
  if (onlyInStock) themesParams.set('onlyInStock', '1')

  let themeOptions: ThemeOpt[] = []
  let seriesOptionsAll: SeriesOpt[] = []

  {
    const r = await fetch(`${proto}://${host}/api/themes?${themesParams.toString()}`)
    if (r.ok) {
      const data = await r.json()
      themeOptions = Array.isArray(data.options) ? data.options : []
      seriesOptionsAll = Array.isArray(data.series) ? data.series : []
    }
  }

  return {
    props: {
      items, count, page, limit, q, cond, onlyInStock, theme, series,
      themeOptions, seriesOptionsAll,
    },
  }
}