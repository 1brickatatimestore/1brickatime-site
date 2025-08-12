// src/pages/minifigs.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { decode } from 'html-entities'

type Item = {
  _id?: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  qty?: number | null
  imageUrl?: string | null
  condition?: 'N' | 'U' | string | null
  type?: string | null
}

type ThemeOpt = { key?: string; code?: string; label: string; count: number }

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q: string
  theme: string
  condition: string
  inStock: boolean
  themes: ThemeOpt[]
}

function pick<T>(v: T | undefined | null, fallback: T): T {
  return v == null ? fallback : v
}

export default function MinifigsPage(props: Props) {
  const {
    items,
    count,
    page,
    limit,
    q,
    theme,
    condition,
    inStock,
    themes,
  } = props

  const totalPages = Math.max(1, Math.ceil(count / limit))

  return (
    <>
      <Head>
        <title>{`Minifigs (${count}) – 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <h1 className="title">Minifigures <span className="muted">({count})</span></h1>

        {/* Filters */}
        <form className="filters" method="GET" action="/minifigs">
          <input type="hidden" name="type" value="MINIFIG" />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="limit" value={String(limit)} />

          <div className="row">
            <label className="field">
              <span className="lab">Search</span>
              <input
                type="text"
                name="q"
                placeholder="name or number…"
                defaultValue={q}
              />
            </label>

            <label className="field">
              <span className="lab">Theme</span>
              <select name="theme" defaultValue={theme}>
                <option value="">All themes</option>
                {[...themes]
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((t) => {
                    const key = (t.key || t.code || t.label).toString()
                    return (
                      <option key={key} value={key}>
                        {t.label} ({t.count})
                      </option>
                    )
                  })}
              </select>
            </label>

            <fieldset className="field">
              <legend className="lab">Condition</legend>
              <div className="conds">
                <label className="chip">
                  <input type="radio" name="condition" value="" defaultChecked={!condition} />
                  <span>All</span>
                </label>
                <label className="chip">
                  <input type="radio" name="condition" value="N" defaultChecked={condition === 'N'} />
                  <span>New</span>
                </label>
                <label className="chip">
                  <input type="radio" name="condition" value="U" defaultChecked={condition === 'U'} />
                  <span>Used</span>
                </label>
              </div>
            </fieldset>

            <label className="tick">
              <input type="checkbox" name="inStock" value="1" defaultChecked={inStock} />
              <span>In stock only</span>
            </label>

            <button className="apply" type="submit">Apply</button>
          </div>
        </form>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="empty">No items found.</div>
        ) : (
          <>
            <div className="grid">
              {items.map((p) => {
                const id = p.inventoryId ?? p._id ?? `${p.itemNo}-${Math.random()}`
                const name = decode(p.name || '') || p.itemNo || 'Minifig'
                const href = p.inventoryId ? `/minifig/${p.inventoryId}` : '#'
                return (
                  <article key={id} className="card">
                    <Link href={href} className="imgBox" aria-label={name}>
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
                    <div className="meta">
                      <h3 className="name">{name}</h3>
                      <div className="line">
                        {p.itemNo && <span className="pill">{p.itemNo}</span>}
                        {p.condition && <span className="pill">{p.condition === 'N' ? 'New' : 'Used'}</span>}
                        <span className="pill">{p.qty ?? 0} in stock</span>
                      </div>
                      <div className="price">{p.price != null ? `AU$ ${p.price}` : '—'}</div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination */}
            <nav className="pager">
              <PageLink page={page - 1} disabled={page <= 1} label="← Prev"
                q={q} theme={theme} condition={condition} inStock={inStock} limit={limit} />
              <span className="pinfo">
                Page {page} of {totalPages}
              </span>
              <PageLink page={page + 1} disabled={page >= totalPages} label="Next →"
                q={q} theme={theme} condition={condition} inStock={inStock} limit={limit} />
            </nav>
          </>
        )}
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 24px 120px; /* keep clear of footer */
        }
        .title { margin: 0 0 12px; font-size: 28px; }
        .muted { color: #666; font-weight: 500; }

        .filters { margin: 8px 0 18px; }
        .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .field { display: grid; gap: 6px; }
        .lab { font-size: 12px; color: #2b2b2b; }
        input[type="text"], select {
          height: 36px; padding: 0 10px; border: 1px solid #c7c3bd; border-radius: 8px; background: #fff;
          min-width: 220px;
        }
        .conds { display: flex; gap: 6px; }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid #c7c3bd; border-radius: 999px; }
        .tick { display: inline-flex; align-items: center; gap: 8px; }
        .apply {
          height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #204d69; background: #ffd969; font-weight: 700; color: #1a1a1a;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .card {
          background: #fff;
          border: 1px solid #e0ddd7;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
        }
        .imgBox {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1; /* square */
          background: #faf9f7;
          border-radius: 10px;
          display: block;
          overflow: hidden;
        }
        .noImg {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: #999;
          font-size: 13px;
        }
        .meta { margin-top: 10px; }
        .name { margin: 0 0 6px; font-size: 14px; line-height: 1.25; color: #1f1f1f; }
        .line { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .pill { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: #f0eee9; color: #333; }
        .price { font-weight: 800; color: #1f1f1f; }

        .pager {
          margin: 16px 0 0;
          display: flex; align-items: center; gap: 12px; justify-content: center;
        }
        .pbtn {
          padding: 8px 12px; border-radius: 8px; border: 1px solid #c7c3bd; background: #fff; color: #204d69;
        }
        .pbtn[aria-disabled="true"] { opacity: .45; pointer-events: none; }
        .pinfo { color: #444; }
        @media (max-width: 900px) {
          input[type="text"] { min-width: 160px; }
        }
      `}</style>
    </>
  )
}

function PageLink(props: {
  page: number
  disabled?: boolean
  label: string
  q: string
  theme: string
  condition: string
  inStock: boolean
  limit: number
}) {
  const { page, disabled, label, q, theme, condition, inStock, limit } = props
  const qs = new URLSearchParams()
  qs.set('type', 'MINIFIG')
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (q) qs.set('q', q)
  if (theme) qs.set('theme', theme)
  if (condition) qs.set('condition', condition)
  if (inStock) qs.set('inStock', '1')

  return (
    <Link className="pbtn" href={`/minifigs?${qs.toString()}`} aria-disabled={disabled ? 'true' : 'false'}>
      {label}
    </Link>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req }) => {
  const page = Math.max(1, parseInt((query.page as string) || '1', 10))
  const limit = Math.min(60, Math.max(12, parseInt((query.limit as string) || '36', 10)))
  const q = (query.q as string) || ''
  const theme = (query.theme as string) || ''
  const condition = (query.condition as string) || ''
  const inStock = query.inStock === '1' || query.inStock === 'true'

  const proto = (req.headers['x-forwarded-proto'] as string) || 'http'
  const host = req.headers.host as string
  const base = `${proto}://${host}`

  // Build product query
  const ps = new URLSearchParams()
  ps.set('type', 'MINIFIG')
  ps.set('page', String(page))
  ps.set('limit', String(limit))
  if (q) ps.set('q', q)
  if (theme) ps.set('theme', theme)
  if (condition) ps.set('condition', condition)
  if (inStock) ps.set('inStock', '1')

  const prodRes = await fetch(`${base}/api/products?${ps.toString()}`)
  const prodJson = await prodRes.json().catch(() => ({} as any))
  const items: Item[] = prodJson.items || prodJson.inventory || []
  const count: number = pick<number>(prodJson.count, items.length)

  // Themes for dropdown
  const themesRes = await fetch(`${base}/api/themes`)
  const themesJson = await themesRes.json().catch(() => ({} as any))
  const themes: ThemeOpt[] =
    themesJson.options ||
    themesJson.themes ||
    []

  return {
    props: {
      items,
      count,
      page,
      limit,
      q,
      theme,
      condition,
      inStock,
      themes,
    },
  }
}