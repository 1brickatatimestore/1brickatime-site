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
  qty?: number
}

type ThemeOption = { key: string; label: string; count: number }
type SeriesOption = { key: string; label: string }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  theme: string
  series: string
  q: string
  cond: string
  minPrice: string
  maxPrice: string
  sort: string
  themeOptions: ThemeOption[]
  seriesOptions: SeriesOption[]
}

const CMF_KEY = 'collectible-minifigures'

export default function MinifigsByThemePage(props: Props) {
  const {
    items, count, page, limit, theme, series, q, cond, minPrice, maxPrice, sort,
    themeOptions, seriesOptions,
  } = props
  const router = useRouter()
  const { add } = useCart()

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const isCMF = theme === CMF_KEY

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (series) p.set('series', series)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)
    if (sort) p.set('sort', sort)
    return `/minifigs-by-theme?${p.toString()}`
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const _theme = String(fd.get('theme') || '')
    const _series = String(fd.get('series') || '')
    const _q = String(fd.get('q') || '').trim()
    const _cond = String(fd.get('cond') || '')
    const _min = String(fd.get('minPrice') || '').trim()
    const _max = String(fd.get('maxPrice') || '').trim()
    const _sort = String(fd.get('sort') || 'name_asc')
    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(limit))
    if (_theme) p.set('theme', _theme)
    if (_series && _theme === CMF_KEY) p.set('series', _series)
    if (_q) p.set('q', _q)
    if (_cond) p.set('cond', _cond)
    if (_min) p.set('minPrice', _min)
    if (_max) p.set('maxPrice', _max)
    if (_sort) p.set('sort', _sort)
    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const hasItems = Array.isArray(items) && items.length > 0

  // Keep options stable & readable
  const themeOpts = useMemo(
    () => (themeOptions || []).slice().sort((a, b) => a.label.localeCompare(b.label)),
    [themeOptions]
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
            {themeOpts.map(t => (
              <option key={t.key} value={t.key}>
                {t.label} {t.count ? `(${t.count})` : ''}
              </option>
            ))}
          </select>

          {theme === CMF_KEY && (
            <select name="series" defaultValue={series || ''} className="select">
              <option value="">{`All CMF series`}</option>
              {seriesOptions.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          )}

          <input name="q" defaultValue={q} placeholder="Search…" className="text" />
          <select name="cond" defaultValue={cond} className="select">
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <input name="minPrice" defaultValue={minPrice} inputMode="decimal" placeholder="Min $" className="text w80" />
          <input name="maxPrice" defaultValue={maxPrice} inputMode="decimal" placeholder="Max $" className="text w80" />

          <select name="sort" defaultValue={sort || 'name_asc'} className="select">
            <option value="name_asc">Name A→Z</option>
            <option value="name_desc">Name Z→A</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="newest">Newest</option>
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
        .text { min-width:220px; }
        .w80 { min-width:0; width:90px; }
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
  const limit = Math.max(1, Math.min(100, Number(query.limit ?? 72)))
  const theme = typeof query.theme === 'string' ? query.theme : ''
  const series = typeof query.series === 'string' ? query.series : ''
  const q = typeof query.q === 'string' ? query.q : ''
  const cond = typeof query.cond === 'string' ? query.cond : ''
  const minPrice = typeof query.minPrice === 'string' ? query.minPrice : ''
  const maxPrice = typeof query.maxPrice === 'string' ? query.maxPrice : ''
  const sort = typeof query.sort === 'string' ? query.sort : 'name_asc'

  // 1) products for the current filters
  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (theme) params.set('theme', theme)
  if (series) params.set('series', series)
  if (q) params.set('q', q)
  if (cond) params.set('cond', cond)
  if (minPrice) params.set('minPrice', minPrice)
  if (maxPrice) params.set('maxPrice', maxPrice)
  if (sort) params.set('sort', sort)

  let items: Item[] = []
  let count = 0

  const res = await fetch(`${proto}://${host}/api/products?${params.toString()}`)
  if (res.ok) {
    const data = await res.json()
    items = Array.isArray(data.items) ? data.items : []
    count = Number(data.count ?? items.length ?? 0)
  }

  // 2) theme options (with live counts for current cond / stock)
  const themeParams = new URLSearchParams()
  themeParams.set('type', 'MINIFIG')
  themeParams.set('onlyInStock', '1')
  if (cond) themeParams.set('cond', cond)
  const r2 = await fetch(`${proto}://${host}/api/themes?${themeParams.toString()}`)

  let themeOptions: ThemeOption[] = []
  let seriesOptions: SeriesOption[] = []
  if (r2.ok) {
    const data = await r2.json()
    if (Array.isArray(data.options)) themeOptions = data.options
    if (Array.isArray(data.series)) seriesOptions = data.series
  }

  return {
    props: {
      items, count, page, limit, theme, series, q, cond, minPrice, maxPrice, sort,
      themeOptions, seriesOptions,
    },
  }
}