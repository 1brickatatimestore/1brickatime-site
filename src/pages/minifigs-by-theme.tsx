// src/pages/minifigs-by-theme.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Product = {
  _id?: string
  inventoryId?: number
  name: string
  itemNo?: string
  imageUrl: string
  price?: number
  qty?: number
}

type GroupKey = 'main' | 'collectibles' | 'other' | null

type ThemeOpt = {
  value: string
  label: string
  count: number | null            // <— never undefined
  group?: GroupKey
}

type Props = {
  items: Product[]
  total: number
  page: number
  limit: number
  onlyInStock: boolean
  options: ThemeOpt[]
  currentTheme: string
  allCount: number
}

function decodeHtml(s: string) {
  if (!s) return ''
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&#40;', '(')
    .replaceAll('&#41;', ')')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

const num = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString() : ''

export default function MinifigsByThemePage({
  items,
  total,
  page,
  limit,
  onlyInStock,
  options,
  currentTheme,
  allCount,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)))

  const grouped = options.reduce(
    (acc, o) => {
      const g: Exclude<GroupKey, null> =
        (o.group || 'main') as Exclude<GroupKey, null>
      acc[g].push(o)
      return acc
    },
    { main: [] as ThemeOpt[], collectibles: [] as ThemeOpt[], other: [] as ThemeOpt[] }
  )

  return (
    <>
      <Head>
        <title>Minifigs by Theme ({num(allCount)})</title>
      </Head>

      <div className="wrap">
        <h1>
          Minifigs by Theme <span className="muted">({num(allCount)})</span>
        </h1>

        <form className="toolbar" method="get" action="/minifigs-by-theme">
          <label>
            Theme:{' '}
            <select name="theme" defaultValue={currentTheme}>
              <option value="">All Minifigs</option>

              {grouped.main.length > 0 && (
                <optgroup label="Main themes">
                  {grouped.main.map((o) => (
                    <option key={`m-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {grouped.collectibles.length > 0 && (
                <optgroup label="Collectible Minifigures">
                  {grouped.collectibles.map((o) => (
                    <option key={`c-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {grouped.other.length > 0 && (
                <optgroup label="Other">
                  {grouped.other.map((o) => (
                    <option key={`o-${o.value}`} value={o.value}>
                      {o.label} {o.count !== null ? `— ${o.count}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label>
            Per page:{' '}
            <select name="limit" defaultValue={String(limit)}>
              {[12, 24, 36, 48, 72].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="stock">
            <input type="checkbox" name="stock" value="1" defaultChecked={onlyInStock} />{' '}
            Only in stock
          </label>

          <input type="hidden" name="page" value="1" />
          <button type="submit" className="btn sm">Apply</button>

          <Link href="/minifigs" className="allLink">All Minifigs</Link>
        </form>

        <div className="grid">
          {items.map((p) => (
            <article
              key={(p.inventoryId ?? p._id ?? Math.random()).toString()}
              className="card"
            >
              <div className="imgBox">
                {/* Image cropping fix: square, padded, contain */}
                <Image
                  src={p.imageUrl}
                  alt={decodeHtml(p.name)}
                  fill
                  sizes="(max-width: 600px) 50vw, 220px"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              <div className="meta">
                <h3 className="name">{decodeHtml(p.name)}</h3>
                <div className="row">
                  <span className="code">{p.itemNo}</span>
                  <span className="price">
                    {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : ''}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pager">
          <span>Page {num(page)} / {num(pageCount)}</span>
          <div className="sp" />
          <Pager page={page} pageCount={pageCount} limit={limit} theme={currentTheme} stock={onlyInStock} />
        </div>
      </div>

      <style jsx>{`
        .wrap { max-width: 1100px; margin: 0 auto; padding: 16px 20px 120px; }
        h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.2; color: #1e2a32; }
        .muted { color: #4e6370; font-weight: 600; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; margin-bottom: 16px; font-size: 14px; }
        select { padding: 6px 8px; border-radius: 8px; border: 1px solid #cbd5df; background: #fff; }
        .stock { margin-left: 8px; }
        .btn.sm { padding: 6px 10px; border: 1px solid #204d69; color: #204d69; background: #fff; border-radius: 8px; font-weight: 600; }
        .allLink { margin-left: auto; color: #204d69; font-weight: 600; text-decoration: none; }
        .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 980px) { .grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 760px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 540px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 10px rgba(0,0,0,.04); padding: 10px; display: flex; flex-direction: column; }
        .imgBox { position: relative; aspect-ratio: 1 / 1; background: #fff; border-radius: 10px; overflow: hidden; padding: 8px; border: 1px solid rgba(0,0,0,.06); }
        .meta { margin-top: 8px; }
        .name { font-size: 14px; line-height: 1.25; margin: 0 0 6px; color: #1a1a1a; min-height: 34px; }
        .row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
        .code { color: #6c7a86; font-size: 12px; }
        .price { font-weight: 700; color: #0e3a53; }
        .pager { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 18px 0 0; font-weight: 600; color: #294b5f; }
        .sp { width: 10px; }
        .pager a { border: 1px solid #b8c7d2; padding: 6px 10px; border-radius: 8px; text-decoration: none; color: #204d69; background: #fff; }
        .pager a[aria-disabled='true'] { pointer-events: none; opacity: .45; }
      `}</style>
    </>
  )
}

function Pager({
  page,
  pageCount,
  limit,
  theme,
  stock,
}: {
  page: number
  pageCount: number
  limit: number
  theme: string
  stock: boolean
}) {
  const qp = (n: number) => {
    const u = new URL('http://x/minifigs-by-theme')
    if (theme) u.searchParams.set('theme', theme)
    if (limit) u.searchParams.set('limit', String(limit))
    if (stock) u.searchParams.set('stock', '1')
    u.searchParams.set('page', String(n))
    return u.search
  }
  const prev = Math.max(1, page - 1)
  const next = Math.min(pageCount, page + 1)
  return (
    <>
      <Link href={`/minifigs-by-theme${qp(1)}`} aria-disabled={page === 1}>« First</Link>
      <Link href={`/minifigs-by-theme${qp(prev)}`} aria-disabled={page === 1}>‹ Prev</Link>
      <Link href={`/minifigs-by-theme${qp(next)}`} aria-disabled={page === pageCount}>Next ›</Link>
      <Link href={`/minifigs-by-theme${qp(pageCount)}`} aria-disabled={page === pageCount}>Last »</Link>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { query } = ctx
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.max(1, parseInt(String(query.limit || '36'), 10) || 36)
  const onlyInStock = String(query.stock || '') === '1'
  const currentTheme = String(query.theme || '')

  const base =
    process. PAYPAL_CLIENT_SECRET_REDACTED||
    `http://localhost:${process.env.PORT || 3000}`

  const getJson = async (url: string) => {
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      return await r.json()
    } catch {
      return null
    }
  }

  // themes
  const themesJson = await getJson(`${base}/api/themes`)
  let options: any[] = []
  let allCount = 0

  if (themesJson) {
    if (Array.isArray(themesJson.options)) options = themesJson.options
    else if (Array.isArray(themesJson)) options = themesJson

    if (typeof themesJson?.allCount === 'number') allCount = themesJson.allCount
    else if (typeof themesJson?.total === 'number') allCount = themesJson.total
    else if (typeof themesJson?.count === 'number') allCount = themesJson.count
  }

  const ensure = (val: string, label: string, group: Exclude<GroupKey, null>) => {
    if (!options.find((o) => o.value === val)) {
      options.push({ value: val, label, group, count: null })
    }
  }
  ensure('', 'All Minifigs', 'main')
  ensure('collectibles', 'Collectible Minifigures', 'collectibles')
  ensure('other', 'Other (Singles)', 'other')

  // products
  const qs = new URLSearchParams()
  qs.set('type', 'MINIFIG')
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (onlyInStock) qs.set('stock', '1')
  if (currentTheme) qs.set('theme', currentTheme)

  const prodsJson = await getJson(`${base}/api/products?${qs.toString()}`)
  const items: Product[] =
    prodsJson?.items || prodsJson?.products || prodsJson?.data || []
  const total =
    typeof prodsJson?.total === 'number'
      ? prodsJson.total
      : Array.isArray(items)
      ? items.length
      : 0

  if (!allCount) {
    if (!currentTheme && typeof prodsJson?.grandTotal === 'number') allCount = prodsJson.grandTotal
    else if (!currentTheme) allCount = total
  }

  // **Normalize options so NO property is undefined**
  const normalizedOptions: ThemeOpt[] = (options || []).map((o) => {
    const g: GroupKey =
      typeof o.group === 'string'
        ? (o.group as GroupKey)
        : o.value === 'other'
        ? 'other'
        : null
    return {
      value: String(o.value ?? ''),
      label: String(o.label ?? '').trim(),
      count: typeof o.count === 'number' ? o.count : null, // <-- null, not undefined
      group: g,                                           // <-- null allowed
    }
  })

  return {
    props: {
      items,
      total,
      page,
      limit,
      onlyInStock,
      options: normalizedOptions,
      currentTheme,
      allCount,
    },
  }
}