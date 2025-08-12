import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
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
type SeriesOpt = { value: string; label: string; count?: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  theme: string
  series: string
  themeOptions: ThemeOpt[]
  seriesOptionsLive: SeriesOpt[] // may be empty; we fallback gracefully
}

const CMF_THEME_KEY = 'collectible-minifigures'
const DEFAULT_CMF_SERIES: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
]

export default function MinifigsByThemePage(props: Props) {
  const { items, count, page, limit, theme, series, themeOptions, seriesOptionsLive } = props
  const { add } = useCart()
  const router = useRouter()

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const hasItems = Array.isArray(items) && items.length > 0

  // Alphabetical themes, push Other (Singles) to end
  const sortedThemeOptions = useMemo(() => {
    const opts = [...themeOptions]
    opts.sort((a, b) => a.label.localeCompare(b.label))
    const otherIdx = opts.findIndex(o => /Other\s*\(Singles\)/i.test(o.label))
    if (otherIdx > -1) {
      const [other] = opts.splice(otherIdx, 1)
      opts.push(other)
    }
    return opts
  }, [themeOptions])

  // Build series dropdown options:
  // Prefer live counts (from /api/themes-series). If empty, fallback to simple labels without counts.
  const cmfSeriesOptions: SeriesOpt[] = useMemo(() => {
    if (Array.isArray(seriesOptionsLive) && seriesOptionsLive.length > 0) {
      // Sort numerically by value just in case
      return [...seriesOptionsLive].sort((a, b) => Number(a.value) - Number(b.value))
    }
    return DEFAULT_CMF_SERIES.map(n => ({ value: String(n), label: `Series ${n}` }))
  }, [seriesOptionsLive])

  const buildHref = (nextPage: number, nextTheme: string, nextSeries: string) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (nextTheme) p.set('theme', nextTheme)
    if (nextTheme === CMF_THEME_KEY && nextSeries && nextSeries !== '__ALL__') {
      p.set('series', nextSeries)
    }
    return `/minifigs-by-theme?${p.toString()}`
  }

  const pushTheme = (nextTheme: string) => {
    const nextSeries = nextTheme === CMF_THEME_KEY ? (series || '__ALL__') : ''
    router.push(buildHref(1, nextTheme, nextSeries))
  }

  const pushSeries = (nextSeries: string) => {
    router.push(buildHref(1, theme, nextSeries))
  }

  const onChangeTheme: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    pushTheme(e.target.value)
  }
  const onChangeSeries: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    pushSeries(e.target.value)
  }

  // ENTER support on selects
  const onKeyDownTheme: React.KeyboardEventHandler<HTMLSelectElement> = (e) => {
    if (e.key === 'Enter') pushTheme((e.target as HTMLSelectElement).value)
  }
  const onKeyDownSeries: React.KeyboardEventHandler<HTMLSelectElement> = (e) => {
    if (e.key === 'Enter') pushSeries((e.target as HTMLSelectElement).value)
  }

  return (
    <>
      <Head>
        <title>{`Minifigs by Theme — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={(e) => e.preventDefault()}>
          <label className="lbl">Theme</label>
          <select
            className="select"
            value={theme}
            onChange={onChangeTheme}
            onKeyDown={onKeyDownTheme}
          >
            <option value="__ALL__">All themes</option>
            {sortedThemeOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.count})
              </option>
            ))}
          </select>

          {theme === CMF_THEME_KEY && (
            <>
              <label className="lbl">Series</label>
              <select
                className="select"
                value={series || '__ALL__'}
                onChange={onChangeSeries}
                onKeyDown={onKeyDownSeries}
              >
                <option value="__ALL__">All series</option>
                {cmfSeriesOptions.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.count ? `${s.label} (${s.count})` : s.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <span className="meta">
            {count} items • Page {page}/{pages}
          </span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map((p) => {
                const id = p.inventoryId ? String(p.inventoryId) : (p._id as string)
                return (
                  <article key={id} className="card">
                    <Link href={`/minifig/${encodeURIComponent(id)}`} className="imgLink" title={p.name || p.itemNo || 'Minifig'}>
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
                    </Link>

                    <Link href={`/minifig/${encodeURIComponent(id)}`} className="name" title={p.name}>
                      {p.name || p.itemNo || 'Minifig'}
                    </Link>

                    <div className="priceRow">
                      <span className="price">
                        ${Number(p.price ?? 0).toFixed(2)}{p.condition ? ` • ${p.condition}` : ''}
                      </span>

                      <button
                        className="addBtn"
                        onClick={() =>
                          add({
                            id,
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
                )
              })}
            </div>

            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <Link className="pbtn" href={buildHref(Math.max(1, page - 1), theme, series)} aria-disabled={page <= 1}>
                  ← Prev
                </Link>
                <span className="pmeta">Page {page} / {pages}</span>
                <Link className="pbtn" href={buildHref(Math.min(pages, page + 1), theme, series)} aria-disabled={page >= pages}>
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
        .lbl { font-size:13px; color:#2b2b2b; font-weight:700; }
        .select { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; min-width:220px; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgLink { display:block; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { display:block; font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; font-weight:700; text-decoration:none; }
        .name:hover { text-decoration:underline; }
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
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 36)))
  const theme = typeof query.theme === 'string' ? query.theme : '__ALL__'
  const series = typeof query.series === 'string' ? query.series : ''

  // 1) Themes (keep your existing backend behavior)
  let themeOptions: ThemeOpt[] = []
  try {
    const r = await fetch(`${proto}://${host}/api/themes`)
    if (r.ok) {
      const data = await r.json()
      const opts = Array.isArray(data) ? data : Array.isArray(data.options) ? data.options : []
      themeOptions = opts.filter(Boolean)
    }
  } catch {}

  // 2) Live series counts (from the NEW endpoint); safe fallback to empty
  let seriesOptionsLive: SeriesOpt[] = []
  try {
    const r2 = await fetch(`${proto}://${host}/api/themes-series`)
    if (r2.ok) {
      const d = await r2.json()
      if (Array.isArray(d.series)) seriesOptionsLive = d.series
    }
  } catch {}

  // 3) Items for current selection
  const ps = new URLSearchParams()
  ps.set('type', 'MINIFIG')
  ps.set('page', String(page))
  ps.set('limit', String(limit))
  if (theme && theme !== '__ALL__') ps.set('theme', theme)
  if (theme === CMF_THEME_KEY && series && series !== '__ALL__') ps.set('series', series)

  let items: Item[] = []
  let count = 0
  try {
    const r3 = await fetch(`${proto}://${host}/api/products?${ps.toString()}`)
    if (r3.ok) {
      const data = await r3.json()
      const arr =
        (Array.isArray(data.inventory) && data.inventory) ||
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.results) && data.results) ||
        []
      items = arr
      count = Number(data.count ?? arr.length ?? 0)
    }
  } catch {}

  return { props: { items, count, page, limit, theme, series, themeOptions, seriesOptionsLive } }
}