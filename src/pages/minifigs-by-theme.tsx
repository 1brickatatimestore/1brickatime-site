import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
type ThemeOption = { key: string; label: string; count: number }
type SeriesOption = { key: string; label: string; count: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  minPrice: string
  maxPrice: string
  sort: string
  onlyInStock: boolean
  theme: string
  series: string
  themeOptions: ThemeOption[]
  seriesOptions: SeriesOption[]
}

const CMF = 'collectible-minifigures'

export default function MinifigsByThemePage(p: Props) {
  const {
    items, count, page, limit, q, cond, minPrice, maxPrice, sort, onlyInStock,
    theme, series, themeOptions, seriesOptions
  } = p
  const router = useRouter()
  const { add } = useCart()
  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const isCMF = theme === CMF
  const hasItems = Array.isArray(items) && items.length > 0

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const q = String(fd.get('q') || '').trim()
    const cond = String(fd.get('cond') || '')
    const theme = String(fd.get('theme') || '')
    const series = String(fd.get('series') || '')
    const min = String(fd.get('minPrice') || '').trim()
    const max = String(fd.get('maxPrice') || '').trim()
    const sort = String(fd.get('sort') || '')
    const only = fd.get('only') ? '1' : ''
    const limit = String(fd.get('limit') || '36')

    const sp = new URLSearchParams()
    sp.set('page', '1')
    sp.set('limit', limit)
    if (q) sp.set('q', q)
    if (cond) sp.set('cond', cond)
    if (theme) sp.set('theme', theme)
    if (theme === CMF && series) sp.set('series', series)
    if (min) sp.set('minPrice', min)
    if (max) sp.set('maxPrice', max)
    if (sort) sp.set('sort', sort)
    if (only) sp.set('onlyInStock', '1')
    router.push(`/minifigs-by-theme?${sp.toString()}`)
  }

  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams()
    sp.set('page', String(n))
    sp.set('limit', String(limit))
    if (q) sp.set('q', q)
    if (cond) sp.set('cond', cond)
    if (theme) sp.set('theme', theme)
    if (isCMF && series) sp.set('series', series)
    if (minPrice) sp.set('minPrice', minPrice)
    if (maxPrice) sp.set('maxPrice', maxPrice)
    if (sort) sp.set('sort', sort)
    if (onlyInStock) sp.set('onlyInStock', '1')
    return `/minifigs-by-theme?${sp.toString()}`
  }

  return (
    <>
      <Head><title>Minifigs by Theme — 1 Brick at a Time</title></Head>

      <main className="wrap">
        <form className="filters" onSubmit={submit}>
          <select name="theme" defaultValue={theme || ''} className="select">
            <option value="">All themes</option>
            {themeOptions.map(t => (
              <option key={t.key} value={t.key}>{t.label} ({t.count})</option>
            ))}
          </select>

          {theme === CMF && (
            <select name="series" defaultValue={series || ''} className="select">
              <option value="">All series</option>
              {seriesOptions.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          )}

          <input name="q" defaultValue={q} placeholder="Search name or number…" className="text" />
          <select name="cond" defaultValue={cond} className="select">
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <input name="minPrice" defaultValue={minPrice} inputMode="decimal" placeholder="Min $" className="num" />
          <input name="maxPrice" defaultValue={maxPrice} inputMode="decimal" placeholder="Max $" className="num" />
          <select name="sort" defaultValue={sort || 'name_asc'} className="select">
            <option value="name_asc">Name A → Z</option>
            <option value="name_desc">Name Z → A</option>
            <option value="price_asc">Price low → high</option>
            <option value="price_desc">Price high → low</option>
          </select>

          <select name="limit" defaultValue={String(limit)} className="select">
            <option value="36">36</option>
            <option value="72">72</option>
          </select>

          <label className="chk">
            <input type="checkbox" name="only" defaultChecked={onlyInStock} /> Only in stock
          </label>

          <button type="submit" className="btnPrimary">Apply</button>
          <Link className="btnGhost" href="/minifigs-by-theme">Clear</Link>

          <span className="meta">{count} items • Page {page}/{pages}</span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map(p => {
                const id = p.inventoryId ? String(p.inventoryId) : (p._id as string)
                const detailsHref = `/minifig/${id}`
                return (
                  <article key={id} className="card">
                    <Link className="clickArea" href={detailsHref} aria-label={`Open ${p.name || p.itemNo}`} />
                    <div className="imgBox">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name || p.itemNo || 'Minifig'}
                          fill
                          sizes="(max-width: 900px) 50vw, 240px"
                          style={{ objectFit: 'contain' }}
                        />
                      ) : <div className="noImg">No image</div>}
                    </div>
                    <h3 className="name">
                      <Link href={detailsHref}>{p.name || p.itemNo || 'Minifig'}</Link>
                    </h3>
                    <div className="priceRow">
                      <span className="price">
                        ${Number(p.price ?? 0).toFixed(2)} {p.condition ? `• ${p.condition}` : ''}
                      </span>
                      <button
                        type="button"
                        className="addBtn"
                        onClick={() => add({
                          id, name: p.name ?? p.itemNo ?? 'Minifig',
                          price: Number(p.price ?? 0), qty: 1, imageUrl: p.imageUrl
                        })}
                      >
                        Add to cart
                      </button>
                    </div>
                    <div className="row"><Link className="details" href={detailsHref}>Details</Link></div>
                  </article>
                )
              })}
            </div>

            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <Link className="pbtn" href={hrefForPage(Math.max(1, page - 1))} aria-disabled={page <= 1}>← Prev</Link>
                <span className="pmeta">Page {page} / {pages}</span>
                <Link className="pbtn" href={hrefForPage(Math.min(pages, page + 1))} aria-disabled={page >= pages}>Next →</Link>
              </nav>
            )}
          </>
        ) : <p className="empty">No items found.</p>}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1200px; }
        .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:6px 0 14px; }
        .text, .select, .num { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; }
        .text { min-width:260px; }
        .num { width:100px; }
        .chk { display:flex; align-items:center; gap:6px; color:#333; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; cursor:pointer; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { position:relative; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .clickArea { position:absolute; inset:0 0 64px 0; z-index:1; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; cursor:pointer; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a){ color:#1e1e1e; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; z-index:2; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; }
        .row { margin-top:6px; z-index:2; }
        .details { color:#204d69; font-weight:600; }
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
  const q = typeof query.q === 'string' ? query.q : ''
  const cond = typeof query.cond === 'string' ? query.cond : ''
  const minPrice = typeof query.minPrice === 'string' ? query.minPrice : ''
  const maxPrice = typeof query.maxPrice === 'string' ? query.maxPrice : ''
  const sort = typeof query.sort === 'string' ? query.sort : 'name_asc'
  const theme = typeof query.theme === 'string' ? query.theme : ''
  const series = typeof query.series === 'string' ? query.series : ''
  const onlyInStock = query.onlyInStock === '1' || query.only === '1'

  const p = new URLSearchParams()
  p.set('type', 'MINIFIG')
  p.set('page', String(page))
  p.set('limit', String(limit))
  if (q) p.set('q', q)
  if (cond) p.set('cond', cond)
  if (theme) p.set('theme', theme)
  if (series) p.set('series', series)
  if (minPrice) p.set('minPrice', minPrice)
  if (maxPrice) p.set('maxPrice', maxPrice)
  if (sort) p.set('sort', sort)
  if (onlyInStock) p.set('onlyInStock', '1')

  let items: Item[] = []
  let count = 0
  const res = await fetch(`${proto}://${host}/api/products?${p.toString()}`)
  if (res.ok) {
    const data = await res.json()
    const arr =
      (Array.isArray(data.inventory) && data.inventory) ||
      (Array.isArray(data.items) && data.items) ||
      (Array.isArray(data.results) && data.results) || []
    items = arr
    count = Number(data.count ?? arr.length ?? 0)
  }

  // live theme counts (respect filters)
  const t = new URLSearchParams()
  t.set('type', 'MINIFIG')
  if (cond) t.set('cond', cond)
  if (onlyInStock) t.set('onlyInStock', '1')
  const tres = await fetch(`${proto}://${host}/api/themes?${t.toString()}`)
  let themeOptions: ThemeOption[] = []
  let seriesOptions: SeriesOption[] = []
  if (tres.ok) {
    const data = await tres.json()
    themeOptions = Array.isArray(data.options) ? data.options : []
    seriesOptions = Array.isArray(data.series) ? data.series : []
  }

  return { props: {
    items, count, page, limit, q, cond, minPrice, maxPrice, sort,
    onlyInStock, theme, series, themeOptions, seriesOptions
  } }
}