import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useMemo, useState } from 'react'
import { useCart } from '@/context/CartContext'

type Option = { key: string; label: string; count: number }
type Item = {
  _id: string
  inventoryId?: number
  itemNo: string
  name: string
  imageUrl: string
  price: number
  condition?: string
  qty: number
}

type PageProps = {
  themeOptions: Option[]
  seriesOptions: Option[] // CMF series if theme==collectible-minifigures
  items: Item[]
  count: number
  page: number
  limit: number
  theme?: string | null
  series?: string | null
  q: string
  cond: string
  onlyInStock: boolean
  sort?: string | null
  minPrice?: number | null
  maxPrice?: number | null
}

function detailHref(it: Item) {
  const id = (it.inventoryId ?? it._id).toString()
  return `/minifig/${encodeURIComponent(id)}`
}

export default function MinifigsByThemePage(props: PageProps) {
  const router = useRouter()
  const { add } = useCart()

  const [theme, setTheme] = useState(props.theme || '')
  const [series, setSeries] = useState(props.series || '')
  const [q, setQ] = useState(props.q || '')
  const [cond, setCond] = useState(props.cond || '')
  const [onlyInStock, setOnlyInStock] = useState(props.onlyInStock || false)
  const [limit, setLimit] = useState(props.limit || 36)
  const [minPrice, setMinPrice] = useState(props.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(props.maxPrice ?? '')
  const [sort, setSort] = useState(props.sort || 'name_asc')

  const pages = useMemo(() => Math.max(1, Math.ceil(props.count / props.limit)), [props.count, props.limit])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('type', 'MINIFIG')
    if (theme) params.set('theme', theme)
    if (series) params.set('series', series)
    if (q) params.set('q', q)
    if (cond) params.set('cond', cond)
    if (onlyInStock) params.set('onlyInStock', '1')
    if (minPrice !== '') params.set('minPrice', String(minPrice))
    if (maxPrice !== '') params.set('maxPrice', String(maxPrice))
    if (sort) params.set('sort', sort)
    params.set('page', '1')
    params.set('limit', String(limit))
    router.push(`/minifigs-by-theme?${params.toString()}`)
  }

  const showSeries = theme === 'collectible-minifigures'

  return (
    <>
      <Head><title>Minifigs by Theme — 1 Brick at a Time</title></Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <select className="select" value={theme || ''} onChange={(e) => setTheme(e.target.value)}>
            <option value="">All themes</option>
            {props.themeOptions.map(t => (
              <option key={t.key} value={t.key}>{t.label} ({t.count})</option>
            ))}
          </select>

          {showSeries && (
            <select className="select" value={series || ''} onChange={(e) => setSeries(e.target.value)}>
              <option value="">All series</option>
              {props.seriesOptions.map(s => (
                <option key={s.key} value={s.key}>{s.label} ({s.count})</option>
              ))}
            </select>
          )}

          <input
            className="input"
            placeholder="Search name or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(e as any) }}
          />

          <select className="select" value={cond} onChange={(e) => setCond(e.target.value)}>
            <option value="">Any condition</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>

          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>

          <label className="check">
            <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} /> Only in stock
          </label>

          <input className="num" type="number" placeholder="Min $" min="0" step="0.01"
            value={String(minPrice)} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} />
          <input className="num" type="number" placeholder="Max $" min="0" step="0.01"
            value={String(maxPrice)} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} />

          <select className="select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={36}>36</option>
            <option value={72}>72</option>
            <option value={108}>108</option>
          </select>

          <button className="btn" type="submit">Apply</button>
          <button className="btn ghost" type="button" onClick={() => router.push('/minifigs-by-theme')}>Clear</button>
        </form>

        <div className="meta">
          {props.count} items • Page {props.page}/{pages}
        </div>

        <section className="grid">
          {props.items.map((it) => (
            <article key={(it.inventoryId ?? it._id).toString()} className="card">
              <Link href={detailHref(it)} className="thumbLink" aria-label={`Open ${it.name}`}>
                <div className="thumb">
                  <img src={it.imageUrl} alt={it.name} />
                </div>
              </Link>

              <h3 className="title">
                <Link href={detailHref(it)}>{it.name}</Link>
              </h3>

              <div className="price">
                ${it.price.toFixed(2)} {!it.condition ? '' : `• ${it.condition}`}
              </div>

              <div className="row">
                <button
                  className="btn"
                  onClick={() => add({
                    id: (it.inventoryId ?? it._id).toString(),
                    itemNo: it.itemNo,
                    name: it.name,
                    price: it.price,
                    imageUrl: it.imageUrl,
                    qty: 1,
                    maxQty: Math.max(0, it.qty ?? 0),
                  })}
                >
                  Add to cart
                </button>
                <Link className="btn ghost" href={detailHref(it)}>Details</Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <style jsx>{`
        .wrap { padding: 24px 16px; max-width: 1200px; margin: 0 auto; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
        .input { flex: 1 1 260px; padding: 8px 10px; border: 1px solid #d0c6b9; border-radius: 8px; }
        .select, .num { padding: 8px 10px; border: 1px solid #d0c6b9; border-radius: 8px; }
        .check { display: flex; align-items: center; gap: 6px; font-size: 14px; }
        .btn { cursor: pointer; padding: 8px 12px; border-radius: 10px; border: 1px solid #d0c6b9; background: #e7c36a; }
        .btn.ghost { background: #fff; }
        .meta { text-align: right; color: #6b6259; font-size: 12px; margin-bottom: 8px; }

        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .grid { grid-template-columns: repeat(2, 1fr); } }

        .card { background: #f6efe6; border: 1px solid #e3d9cc; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .thumbLink { display: block; cursor: pointer; }
        .thumb { width: 100%; aspect-ratio: 1 / 1; background: #fff; border-radius: 10px; border: 1px solid #eadfce; display: grid; place-items: center; overflow: hidden; }
        .thumb img { width: 92%; height: 92%; object-fit: contain; }
        .title { font-size: 14px; font-weight: 600; line-height: 1.25; margin: 0; }
        .title :global(a) { color: #1b1b1b; text-decoration: none; }
        .title :global(a:hover) { text-decoration: underline; }
        .price { font-size: 14px; color: #1b1b1b; }
        .row { display: flex; gap: 8px; }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ query, req }) => {
  const base = process. PAYPAL_CLIENT_SECRET_REDACTED|| `http://${req.headers.host}`

  // 1) Themes + series metadata (respects filters for counts)
  const themeParams = new URLSearchParams()
  themeParams.set('type', 'MINIFIG')
  if (query.onlyInStock) themeParams.set('onlyInStock', String(query.onlyInStock))
  if (query.cond) themeParams.set('cond', String(query.cond))
  const themesRes = await fetch(`${base}/api/themes?${themeParams.toString()}`)
  const themes = await themesRes.json()

  // 2) Products list
  const productParams = new URLSearchParams()
  productParams.set('type', 'MINIFIG')
  if (query.theme) productParams.set('theme', String(query.theme))
  if (query.series) productParams.set('series', String(query.series))
  if (query.q) productParams.set('q', String(query.q))
  if (query.cond) productParams.set('cond', String(query.cond))
  if (query.onlyInStock) productParams.set('onlyInStock', String(query.onlyInStock))
  if (query.minPrice) productParams.set('minPrice', String(query.minPrice))
  if (query.maxPrice) productParams.set('maxPrice', String(query.maxPrice))
  productParams.set('sort', String(query.sort || 'name_asc'))
  productParams.set('page', String(query.page || '1'))
  productParams.set('limit', String(query.limit || '36'))

  const prodRes = await fetch(`${base}/api/products?${productParams.toString()}`)
  const data = await prodRes.json()

  return {
    props: {
      themeOptions: themes.options || [],
      seriesOptions: themes.series || [],
      items: data.items || [],
      count: data.count || 0,
      page: Number(query.page || 1),
      limit: Number(query.limit || 36),
      theme: query.theme ? String(query.theme) : '',
      series: query.series ? String(query.series) : '',
      q: String(query.q || ''),
      cond: String(query.cond || ''),
      onlyInStock: query.onlyInStock === '1' || query.onlyInStock === 'true',
      sort: (query.sort ? String(query.sort) : 'name_asc'),
      minPrice: query.minPrice ? Number(query.minPrice) : null,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
    },
  }
}