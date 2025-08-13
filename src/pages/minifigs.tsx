import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef } from 'react'
import MinifigTile, { MinifigItem } from '@/components/MinifigTile'

type Props = {
  items: MinifigItem[]
  count: number
  page: number
  limit: number
  q: string
  cond: string
  onlyInStock: boolean
  minPrice?: number | null
  maxPrice?: number | null
  sort: string
}

const SORTS = [
  { key: 'name_asc', label: 'Name A → Z' },
  { key: 'name_desc', label: 'Name Z → A' },
  { key: 'price_asc', label: 'Price low → high' },
  { key: 'price_desc', label: 'Price high → low' },
]

export default function MinifigsPage(props: Props) {
  const { items, count, page, limit, q, cond, onlyInStock, minPrice, maxPrice, sort } = props
  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const router = useRouter()
  const qRef = useRef<HTMLInputElement>(null)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sort = String(fd.get('sort') || 'name_asc')
    const q = String(fd.get('q') || '').trim()
    const cond = String(fd.get('cond') || '')
    const onlyInStock = fd.get('in') ? '1' : ''
    const minPrice = String(fd.get('min') || '')
    const maxPrice = String(fd.get('max') || '')

    const p = new URLSearchParams()
    p.set('type', 'MINIFIG')
    p.set('page', '1')
    p.set('limit', String(limit))
    if (sort) p.set('sort', sort)
    if (q) p.set('q', q)
    if (cond) p.set('cond', cond)
    if (onlyInStock) p.set('onlyInStock', '1')
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)

    router.push(`/minifigs?${p.toString()}`)
  }

  const hasItems = Array.isArray(items) && items.length > 0

  return (
    <>
      <Head><title>Minifigs — 1 Brick at a Time</title></Head>

      <main className="wrap">
        <form className="filters" onSubmit={onSubmit}>
          <select name="sort" defaultValue={sort || 'name_asc'} className="select">
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <input ref={qRef} name="q" defaultValue={q} placeholder="Search name or number…" className="text" />
          <select name="cond" defaultValue={cond} className="select">
            <option value="">Any condition</option><option value="N">New</option><option value="U">Used</option>
          </select>
          <label className="chk">
            <input type="checkbox" name="in" defaultChecked={!!onlyInStock} /> In stock only
          </label>
          <input name="min" defaultValue={minPrice ?? ''} inputMode="decimal" placeholder="Min $" className="num" />
          <input name="max" defaultValue={maxPrice ?? ''} inputMode="decimal" placeholder="Max $" className="num" />
          <button className="btnPrimary" type="submit">Apply</button>
          <Link className="btnGhost" href="/minifigs">Clear</Link>
          <span className="meta">{count} items • Page {page}/{pages}</span>
        </form>

        {hasItems ? (
          <>
            <div className="grid">
              {items.map(p => <MinifigTile key={p.inventoryId ?? p._id} item={p} />)}
            </div>

            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <Link className="pbtn" href={buildHref({ page: Math.max(1, page - 1), limit, q, cond, onlyInStock, minPrice, maxPrice, sort })} aria-disabled={page <= 1}>
                  ← Prev
                </Link>
                <span className="pmeta">Page {page} / {pages}</span>
                <Link className="pbtn" href={buildHref({ page: Math.min(pages, page + 1), limit, q, cond, onlyInStock, minPrice, maxPrice, sort })} aria-disabled={page >= pages}>
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
        .num { width:90px; }
        .chk { display:flex; align-items:center; gap:6px; color:#333; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; cursor:pointer; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }

        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }

        .pager { display:flex; gap:12px; align-items:center; justify-content:center; margin:18px 0 6px; }
        .pbtn { border:2px solid #204d69; color:#204d69; padding:6px 12px; border-radius:8px; font-weight:700; }
        .pmeta { color:#333; font-weight:600; }
        .empty { color:#333; font-size:15px; padding:8px 2px; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:14px 16px 110px; } }
      `}</style>
    </>
  )
}

function buildHref(opts: {
  page: number; limit: number; q?: string; cond?: string; onlyInStock?: boolean;
  minPrice?: number | null; maxPrice?: number | null; sort?: string
}) {
  const p = new URLSearchParams()
  p.set('type', 'MINIFIG')
  p.set('page', String(opts.page))
  p.set('limit', String(opts.limit))
  if (opts.q) p.set('q', opts.q)
  if (opts.cond) p.set('cond', opts.cond)
  if (opts.onlyInStock) p.set('onlyInStock', '1')
  if (opts.minPrice != null && String(opts.minPrice)) p.set('minPrice', String(opts.minPrice))
  if (opts.maxPrice != null && String(opts.maxPrice)) p.set('maxPrice', String(opts.maxPrice))
  if (opts.sort) p.set('sort', opts.sort)
  return `/minifigs?${p.toString()}`
}

export async function getServerSideProps(ctx: any) {
  const { req, query } = ctx
  const host = req?.headers?.host || 'localhost:3000'
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'http'

  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 36)))
  const sort = typeof query.sort === 'string' ? query.sort : 'name_asc'
  const q = typeof query.q === 'string' ? query.q : ''
  const cond = typeof query.cond === 'string' ? query.cond : ''
  const onlyInStock = query.onlyInStock === '1' || query.in === '1'
  const minPrice = query.minPrice ? Number(query.minPrice) : null
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : null

  const p = new URLSearchParams()
  p.set('type', 'MINIFIG')
  p.set('page', String(page))
  p.set('limit', String(limit))
  if (sort) p.set('sort', sort)
  if (q) p.set('q', q)
  if (cond) p.set('cond', cond)
  if (onlyInStock) p.set('onlyInStock', '1')
  if (minPrice != null) p.set('minPrice', String(minPrice))
  if (maxPrice != null) p.set('maxPrice', String(maxPrice))

  let items: MinifigItem[] = []
  let count = 0

  const res = await fetch(`${proto}://${host}/api/products?${p.toString()}`)
  if (res.ok) {
    const data = await res.json()
    const arr =
      (Array.isArray(data.items) && data.items) ||
      (Array.isArray(data.inventory) && data.inventory) ||
      (Array.isArray(data.results) && data.results) || []
    items = arr as MinifigItem[]
    count = Number(data.count ?? arr.length ?? 0)
  }

  return { props: { items, count, page, limit, q, cond, onlyInStock, minPrice, maxPrice, sort } }
}