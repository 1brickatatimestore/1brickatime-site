// src/pages/minifigs-by-theme.tsx
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
  imageUrl?: string | null
  qty?: number | null
  type?: string | null
}

type ThemeOpt = { key: string; label: string; count: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  theme: string
  themeOptions: ThemeOpt[]
}

function decodeHtml(input?: string | null) {
  if (!input) return ''
  return input
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function imgFor(p: Item) {
  const direct = (p.imageUrl || '').trim()
  if (direct) return direct
  const code = (p.itemNo || '').trim()
  return code ? `https://img.bricklink.com/ItemImage/MN/0/${code}.png` : ''
}

export default function MinifigsByThemePage({
  items, count, page, limit, q, cond, minPrice = '', maxPrice = '', sort = 'name_asc',
  theme, themeOptions
}: Props) {
  const router = useRouter()
  const { add } = useCart()

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const hasItems = Array.isArray(items) && items.length > 0

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const theme = String(fd.get('theme') || '')
    const q = String(fd.get('q') || '').trim()
    const cond = String(fd.get('cond') || '')
    const minP = String(fd.get('minPrice') || '').trim()
    const maxP = String(fd.get('maxPrice') || '').trim()
    const sort = String(fd.get('sort') || 'name_asc')

    const p = new URLSearchParams()
    p.set('page', '1')
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (minP) p.set('minPrice', minP)
    if (maxP) p.set('maxPrice', maxP)
    if (sort) p.set('sort', sort)
    router.push(`/minifigs-by-theme?${p.toString()}`)
  }

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(nextPage))
    p.set('limit', String(limit))
    if (theme) p.set('theme', theme)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)
    if (sort) p.set('sort', sort)
    return `/minifigs-by-theme?${p.toString()}`
  }

  const labelMap = useMemo(
    () => Object.fromEntries(themeOptions.map(t => [t.key, t.label])),
    [themeOptions]
  )

  return (
    <>
      <Head>
        <title>Minifigs by Theme — 1 Brick at a Time</title>
      </Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <select name="theme" defaultValue={theme || ''} className="select">
            <option value="">All themes</option>
            {themeOptions.map(t => (
              <option key={t.key} value={t.key}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>

          <input name="q" defaultValue={q} placeholder="Search name or number…" className="text" />

          <select name="cond" defaultValue={cond} className="select">
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <input
            name="minPrice"
            defaultValue={minPrice}
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            placeholder="Min $"
            className="num"
          />
          <input
            name="maxPrice"
            defaultValue={maxPrice}
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            placeholder="Max $"
            className="num"
          />

          <select name="sort" defaultValue={sort} className="select">
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="price_asc">Price low→high</option>
            <option value="price_desc">Price high→low</option>
          </select>

          <button type="submit" className="btnPrimary">Apply</button>
          <Link className="btnGhost" href="/minifigs-by-theme">Clear</Link>

          <span className="meta">
            {theme ? (labelMap[theme] || theme) : 'All themes'} • {count} items • Page {page}/{pages}
          </span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map((p) => {
                const href = `/minifig/${encodeURIComponent(p.itemNo || p._id || String(p.inventoryId || ''))}`
                const name = decodeHtml(p.name) || p.itemNo || 'Minifig'
                const img = imgFor(p)
                const price = typeof p.price === 'number' ? p.price : 0
                const qty = typeof p.qty === 'number' ? p.qty : 0

                return (
                  <article key={href} className="card">
                    <Link href={href} className="imgLink" aria-label={name}>
                      <div className="imgBox">
                        {img ? (
                          <Image
                            src={img}
                            alt={name}
                            fill
                            sizes="(max-width: 900px) 50vw, 240px"
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                          />
                        ) : (
                          <div className="noImg">No image</div>
                        )}
                      </div>
                    </Link>

                    <h3 className="name" title={name}>
                      <Link href={href}>{name}</Link>
                    </h3>

                    <div className="priceRow">
                      <span className="price">
                        {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price)}
                        {p.condition ? ` • ${p.condition}` : ''}
                      </span>
                      <button
                        className="addBtn"
                        onClick={() =>
                          add({
                            id: p.itemNo || p._id || String(p.inventoryId || ''),
                            name,
                            price,
                            qty: 1,
                            imageUrl: img || undefined,
                          })
                        }
                      >
                        Add to cart
                      </button>
                    </div>

                    <div className={`stock ${qty > 0 ? 'ok' : 'out'}`}>
                      {qty > 0 ? `${qty} in stock` : 'Sold out'}
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
        .text { min-width:220px; }
        .num { width:110px; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; cursor:pointer; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgLink { display:block; }
        .imgBox { position:relative; width:100%; aspect-ratio:1/1; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .imgBox :global(img){ width:100% !important; height:100% !important; object-fit:contain !important; object-position:center center !important; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a){ color:inherit; text-decoration:none; }
        .name :global(a:hover){ text-decoration:underline; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; }
        .stock { font-size:12px; margin-top:6px; }
        .stock.ok { color:#1a7f37; }
        .stock.out { color:#8a8a8a; }
        .pager { display:flex; gap:12px; align-items:center; justify-content:space-between; margin:18px 0 6px; }
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

  const p = new URLSearchParams()
  p.set('type', 'MINIFIG')
  p.set('page', String(page))
  p.set('limit', String(limit))
  if (theme) p.set('theme', theme)
  if (q) p.set('q', q)
  if (cond) p.set('cond', cond)
  if (minPrice) p.set('minPrice', minPrice)
  if (maxPrice) p.set('maxPrice', maxPrice)
  if (sort) p.set('sort', sort)

  const [itemsRes, themesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/products?${p.toString()}`),
    fetch(`${proto}://${host}/api/themes?type=MINIFIG`)
  ])

  let items: Item[] = []
  let count = 0
  if (itemsRes.ok) {
    const data = await itemsRes.json()
    const arr =
      (Array.isArray(data.inventory) && data.inventory) ||
      (Array.isArray(data.items) && data.items) ||
      (Array.isArray(data.results) && data.results) ||
      []
    items = arr
    count = Number(data.count ?? arr.length ?? 0)
  }

  let themeOptions: ThemeOpt[] = []
  if (themesRes.ok) {
    const t = await themesRes.json()
    if (Array.isArray(t.options)) themeOptions = t.options
  }

  return {
    props: {
      items, count, page, limit, q, cond, minPrice, maxPrice, sort, theme, themeOptions
    }
  }
}