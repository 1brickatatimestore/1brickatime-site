import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useRef } from 'react'
import { useCart } from '@/context/CartContext'

type ThemeOption = { key: string; label: string; count: number }
type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  condition?: string
  imageUrl?: string
  qty?: number
}

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number

  // filters
  theme: string
  series: string
  q: string
  cond: string
  onlyInStock: boolean
  minPrice?: string
  maxPrice?: string
  sort?: string

  // options
  themeOptions: ThemeOption[]
  seriesOptions: ThemeOption[]
}

const COLLECTIBLES_KEY = 'collectible-minifigures'

export default function MinifigsByThemePage(props: Props) {
  const {
    items, count, page, limit,
    theme, series, q, cond, onlyInStock, minPrice, maxPrice, sort,
    themeOptions, seriesOptions,
  } = props

  const router = useRouter()
  const qRef = useRef<HTMLInputElement>(null)
  const isCollectibles = theme === COLLECTIBLES_KEY

  // Build page href preserving filters
  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (isCollectibles && series) p.set('series', series)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (onlyInStock) p.set('onlyInStock', '1')
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)
    if (sort) p.set('sort', sort)
    return `/minifigs-by-theme?${p.toString()}`
  }

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const hasItems = Array.isArray(items) && items.length > 0

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(limit))
    const themeVal = String(fd.get('theme') || '')
    if (themeVal) p.set('theme', themeVal)

    // Only include series if collectibles are selected
    if (themeVal === COLLECTIBLES_KEY) {
      const s = String(fd.get('series') || '')
      if (s) p.set('series', s)
    }

    const qVal = String(fd.get('q') || '').trim()
    if (qVal) p.set('q', qVal)

    const condVal = String(fd.get('cond') || '')
    if (condVal) p.set('cond', condVal)

    if (fd.get('onlyInStock') === 'on') p.set('onlyInStock', '1')

    const minP = String(fd.get('minPrice') || '').trim()
    const maxP = String(fd.get('maxPrice') || '').trim()
    if (minP) p.set('minPrice', minP)
    if (maxP) p.set('maxPrice', maxP)

    const sortVal = String(fd.get('sort') || '')
    if (sortVal) p.set('sort', sortVal)

    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const { add, getQty } = useCart()

  return (
    <>
      <Head>
        <title>{`Minifigs by Theme — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <select name="theme" defaultValue={theme || ''} className="select" aria-label="Theme">
            <option value="">{`All themes`}</option>
            {themeOptions.map(t => (
              <option key={t.key} value={t.key}>{`${t.label} (${t.count})`}</option>
            ))}
          </select>

          {/* Series only when "Collectible Minifigures" */}
          {isCollectibles && (
            <select name="series" defaultValue={series || ''} className="select" aria-label="Series">
              <option value="">{`All series`}</option>
              {seriesOptions.map(s => (
                <option key={s.key} value={s.key}>{`${s.label} (${s.count})`}</option>
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

          <select name="cond" defaultValue={cond || ''} className="select" aria-label="Condition">
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <label className="chk">
            <input type="checkbox" name="onlyInStock" defaultChecked={!!onlyInStock} />
            <span>In stock only</span>
          </label>

          <input
            name="minPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Min $"
            defaultValue={minPrice || ''}
            className="num"
          />
          <input
            name="maxPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Max $"
            defaultValue={maxPrice || ''}
            className="num"
          />

          <select name="sort" defaultValue={sort || 'name_asc'} className="select" aria-label="Sort">
            <option value="name_asc">Name A → Z</option>
            <option value="name_desc">Name Z → A</option>
            <option value="price_asc">Price low → high</option>
            <option value="price_desc">Price high → low</option>
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
                const id = p.inventoryId ? String(p.inventoryId) : String(p._id)
                const stock = Math.max(0, Number(p.qty ?? 0))
                const inCart = getQty(id)
                const disabled = stock <= 0 || inCart >= stock
                const title = stock <= 0
                  ? 'Out of stock'
                  : inCart >= stock
                  ? `You already have the maximum (${stock}) in cart`
                  : 'Add to cart'

                return (
                  <article key={id} className="card">
                    <Link href={`/minifig/${id}`} className="imgLink" title={p.name || p.itemNo || 'Minifig'}>
                      <div className="imgBox">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name || p.itemNo || 'Minifig'}
                            fill
                            sizes="(max-width: 900px) 50vw, 240px"
                            style={{ objectFit: 'contain' }} // proportional, centered
                          />
                        ) : (
                          <div className="noImg">No image</div>
                        )}
                      </div>
                    </Link>

                    <h3 className="name" title={p.name}>
                      <Link href={`/minifig/${id}`}>{p.name || p.itemNo || 'Minifig'}</Link>
                    </h3>

                    <div className="priceRow">
                      <span className="price">
                        ${Number(p.price ?? 0).toFixed(2)} {p.condition ? `• ${p.condition}` : ''}
                      </span>
                      <button
                        className="addBtn"
                        disabled={disabled}
                        aria-disabled={disabled}
                        title={title}
                        onClick={() =>
                          add({
                            id,
                            name: p.name ?? p.itemNo ?? 'Minifig',
                            price: Number(p.price ?? 0),
                            qty: 1,
                            imageUrl: p.imageUrl,
                            stock, // enforce stock
                          })
                        }
                      >
                        {disabled ? 'Sold out' : 'Add to cart'}
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
        .text, .select, .num { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; }
        .text { min-width:240px; }
        .num { width:110px; }
        .chk { display:flex; align-items:center; gap:6px; user-select:none; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; cursor:pointer; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgLink { display:block; cursor:pointer; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a) { color: inherit; text-decoration:none; }
        .name :global(a:hover) { text-decoration:underline; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; }
        .addBtn[disabled], .addBtn[aria-disabled="true"] { opacity:.6; cursor:not-allowed; }
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

  // Parse incoming query
  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 36)))
  const theme = typeof query.theme === 'string' ? query.theme : ''
  const series = typeof query.series === 'string' ? query.series : ''
  const q = typeof query.q === 'string' ? query.q : ''
  const cond = typeof query.cond === 'string' ? query.cond : ''
  const onlyInStock = query.onlyInStock === '1' || query.onlyInStock === 'true'
  const minPrice = typeof query.minPrice === 'string' ? query.minPrice : ''
  const maxPrice = typeof query.maxPrice === 'string' ? query.maxPrice : ''
  const sort = typeof query.sort === 'string' ? query.sort : 'name_asc'

  // 1) Themes (with filters applied so counts are “live”)
  const tParams = new URLSearchParams()
  tParams.set('type', 'MINIFIG')
  if (onlyInStock) tParams.set('onlyInStock', '1')
  if (cond) tParams.set('cond', cond)
  if (minPrice) tParams.set('minPrice', minPrice)
  if (maxPrice) tParams.set('maxPrice', maxPrice)

  let themeOptions: ThemeOption[] = []
  let seriesOptions: ThemeOption[] = []

  try {
    const tRes = await fetch(`${proto}://${host}/api/themes?${tParams.toString()}`)
    if (tRes.ok) {
      const t = await tRes.json()
      if (Array.isArray(t?.options)) themeOptions = t.options
      if (Array.isArray(t?.series)) seriesOptions = t.series
    }
  } catch {}

  // 2) Products list
  const pParams = new URLSearchParams()
  pParams.set('type', 'MINIFIG')
  pParams.set('page', String(page))
  pParams.set('limit', String(limit))
  if (theme) pParams.set('theme', theme)
  if (theme === COLLECTIBLES_KEY && series) pParams.set('series', series)
  if (q) pParams.set('q', q)
  if (cond) pParams.set('cond', cond)
  if (onlyInStock) pParams.set('onlyInStock', '1')
  if (minPrice) pParams.set('minPrice', minPrice)
  if (maxPrice) pParams.set('maxPrice', maxPrice)
  if (sort) pParams.set('sort', sort)

  let items: Item[] = []
  let count = 0

  try {
    const pr = await fetch(`${proto}://${host}/api/products?${pParams.toString()}`)
    if (pr.ok) {
      const data = await pr.json()
      const arr: Item[] =
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.inventory) && data.inventory) ||
        []
      // Strip non-serializable fields if any
      items = arr.map(({ /* createdAt, updatedAt, */ ...rest }) => rest)
      count = Number(data.count ?? arr.length ?? 0)
    }
  } catch {}

  return {
    props: {
      items,
      count,
      page,
      limit,
      theme,
      series,
      q,
      cond,
      onlyInStock,
      minPrice,
      maxPrice,
      sort,
      themeOptions,
      seriesOptions,
    },
  }
}