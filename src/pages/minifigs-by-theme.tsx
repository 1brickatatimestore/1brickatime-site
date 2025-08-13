// src/pages/minifigs-by-theme.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useMemo } from 'react'
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

type ThemeOpt = { key: string; label: string; count: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  theme: string
  series: string
  themeOptions: ThemeOpt[]
  seriesList: ThemeOpt[] // series options returned by /api/themes
}

const COLLECTIBLES_KEY = 'collectible-minifigures'

export default function MinifigsByThemePage({
  items,
  count,
  page,
  limit,
  q,
  cond,
  theme,
  series,
  themeOptions,
  seriesList,
}: Props) {
  const router = useRouter()
  const { add } = useCart()
  const qRef = useRef<HTMLInputElement>(null)
  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))

  const isCollectibles = theme === COLLECTIBLES_KEY
  const seriesOptions = useMemo(() => Array.isArray(seriesList) ? seriesList : [], [seriesList])

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (theme) p.set('theme', theme)
    if (isCollectibles && series) p.set('series', series)
    return `/minifigs-by-theme?${p.toString()}`
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nextQ = String(fd.get('q') || '').trim()
    const nextCond = String(fd.get('cond') || '')
    const nextTheme = String(fd.get('theme') || '')
    const nextSeries = String(fd.get('series') || '')
    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(limit))
    if (nextQ) p.set('q', nextQ)
    if (nextCond) p.set('cond', nextCond)
    if (nextTheme) p.set('theme', nextTheme)
    if (nextTheme === COLLECTIBLES_KEY && nextSeries) p.set('series', nextSeries)
    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const title = (() => {
    const bits = ['Minifigs by Theme']
    if (theme) bits.push('— ' + (themeOptions.find(t => t.key === theme)?.label || theme))
    return `${bits.join(' ')} — 1 Brick at a Time`
  })()

  const hasItems = Array.isArray(items) && items.length > 0

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          {/* Theme */}
          <select name="theme" defaultValue={theme || ''} className="select">
            <option value="">{`All themes`}</option>
            {themeOptions.map(t => (
              <option key={t.key} value={t.key}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>

          {/* Series (always rendered to keep DOM stable; disabled unless Collectibles) */}
          <select
            name="series"
            defaultValue={series || ''}
            className="select"
            disabled={!isCollectibles}
            style={{ visibility: isCollectibles ? 'visible' : 'hidden', width: isCollectibles ? undefined : 0 }}
            aria-hidden={!isCollectibles}
          >
            <option value="">{`All series`}</option>
            {seriesOptions.map(s => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.count})
              </option>
            ))}
          </select>

          {/* Search & condition */}
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

          <button type="submit" className="btnPrimary">Apply</button>
          <Link className="btnGhost" href="/minifigs-by-theme">Clear</Link>

          <span className="meta">
            {count} items • Page {page}/{pages}
          </span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map((p) => {
                const id = p.inventoryId ? String(p.inventoryId) : (p._id as string)
                const name = p.name || p.itemNo || 'Minifig'
                return (
                  <article key={p.inventoryId ?? p._id} className="card">
                    <div className="imgBox">
                      <Link href={`/minifig/${encodeURIComponent(id)}`} aria-label={`View ${name}`}>
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={name}
                            fill
                            sizes="(max-width: 900px) 50vw, 240px"
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          <div className="noImg">No image</div>
                        )}
                      </Link>
                    </div>

                    <h3 className="name" title={name}>
                      <Link href={`/minifig/${encodeURIComponent(id)}`}>{name}</Link>
                    </h3>

                    <div className="priceRow">
                      <span className="price">
                        ${Number(p.price ?? 0).toFixed(2)} {p.condition ? `• ${p.condition}` : ''}
                      </span>

                      <button
                        className="addBtn"
                        onClick={() =>
                          add({
                            id,
                            name,
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
                )
              })}
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
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a){ text-decoration:none; color:inherit; }
        .name :global(a):hover{ text-decoration:underline; }
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

  // Load theme + series options (live counts) with current filters
  const themeParams = new URLSearchParams()
  themeParams.set('type', 'MINIFIG')
  themeParams.set('onlyInStock', '1')
  if (cond) themeParams.set('cond', cond)
  if (q) themeParams.set('q', q)

  let themeOptions: ThemeOpt[] = []
  let seriesList: ThemeOpt[] = []
  try {
    const r = await fetch(`${proto}://${host}/api/themes?${themeParams.toString()}`)
    if (r.ok) {
      const t = await r.json()
      themeOptions = Array.isArray(t.options) ? t.options : []
      seriesList = Array.isArray(t.series) ? t.series : []
    }
  } catch {}

  // Load items list for the current selection
  const productParams = new URLSearchParams()
  productParams.set('type', 'MINIFIG')
  productParams.set('page', String(page))
  productParams.set('limit', String(limit))
  if (q) productParams.set('q', q)
  if (cond) productParams.set('cond', cond)
  if (theme) productParams.set('theme', theme)
  if (theme === COLLECTIBLES_KEY && series) productParams.set('series', series)

  let items: Item[] = []
  let count = 0
  try {
    const r2 = await fetch(`${proto}://${host}/api/products?${productParams.toString()}`)
    if (r2.ok) {
      const data = await r2.json()
      const arr =
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.results) && data.results) ||
        (Array.isArray(data.inventory) && data.inventory) ||
        []
      items = arr
      count = Number(data.count ?? arr.length ?? 0)
    }
  } catch {}

  return {
    props: {
      items,
      count,
      page,
      limit,
      q,
      cond,
      theme,
      series,
      themeOptions,
      seriesList,
    },
  }
}