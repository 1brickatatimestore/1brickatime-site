// src/pages/minifigs-by-theme.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useState } from 'react'

type ThemeOpt = { key: string; label: string; count: number }
type Product = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  imageUrl?: string
}

type PageProps = {
  total: number
  page: number
  limit: number
  inStock: boolean
  theme: string | null
  options: ThemeOpt[]
  items: Product[]
}

function buildBaseUrl(reqHost?: string) {
  // SSR-safe base URL
  return reqHost ? `http://${reqHost}` : 'http://localhost:3000'
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const host = ctx.req.headers.host || 'localhost:3000'
  const base = buildBaseUrl(host)

  const q = ctx.query || {}
  const page = Number(q.page || 1)
  const limit = Number(q.limit || 36)
  const theme = typeof q.theme === 'string' && q.theme.length ? q.theme : null
  const inStock = q.inStock === '1' || q.inStock === 'true'

  // 1) fetch theme options
  const themeRes = await fetch(`${base}/api/themes`)
  const themeJson = await themeRes.json() as { options?: ThemeOpt[] }
  const options = (themeJson.options || []).slice().sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )

  // 2) fetch products for this page
  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (theme) params.set('theme', theme)
  if (inStock) params.set('inStock', '1')

  const prodRes = await fetch(`${base}/api/products?${params.toString()}`)
  const prodJson = await prodRes.json() as {
    count?: number
    inventory?: Product[]
  }

  const total = prodJson.count ?? 0
  const items = prodJson.inventory ?? []

  return {
    props: {
      total,
      page,
      limit,
      inStock,
      theme,
      options,
      items,
    },
  }
}

export default function MinifigsByThemePage(props: PageProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<string>(props.theme || '')
  const [limit, setLimit] = useState<number>(props.limit || 36)
  const [inStock, setInStock] = useState<boolean>(props.inStock || false)

  const apply = () => {
    const params = new URLSearchParams()
    if (theme) params.set('theme', theme)
    params.set('limit', String(limit))
    if (inStock) params.set('inStock', '1')
    params.set('page', '1')
    router.push(`/minifigs-by-theme?${params.toString()}`)
  }

  const title = `Minifigs by Theme (${props.total})`

  return (
    <>
      <Head>
        <title>{`${title} | 1 Brick at a Time`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="wrap">
        <header className="headRow">
          <h1>{title}</h1>
          <div className="spacer" />
          <Link href="/minifigs" className="allLink">All Minifigs</Link>
        </header>

        <div className="controls">
          <label>
            Theme:&nbsp;
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">All Minifigs</option>
              {props.options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label} — {o.count}
                </option>
              ))}
            </select>
          </label>

          <label>
            &nbsp;&nbsp;Per page:&nbsp;
            <select
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
              <option value="60">60</option>
            </select>
          </label>

          <label className="chk">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            &nbsp;Only in stock
          </label>

          <button onClick={apply} className="applyBtn">Apply</button>
        </div>

        {props.items.length === 0 ? (
          <p className="empty">No items found.</p>
        ) : (
          <div className="grid">
            {props.items.map((p) => (
              <article key={p.inventoryId ?? p._id} className="card">
                <div className="imgBox">
                  {p.imageUrl ? (
                    <>
                      {/* Image is centered and not cropped */}
                      <Image
                        src={p.imageUrl}
                        alt={p.name || p.itemNo || 'Minifig'}
                        fill
                        sizes="(max-width: 900px) 50vw, 240px"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                      />
                    </>
                  ) : (
                    <div className="noImg">No image</div>
                  )}
                </div>
                <div className="meta">
                  <h3 className="name">{p.name || p.itemNo || '—'}</h3>
                  <div className="row">
                    <span className="code">{p.itemNo}</span>
                    <span className="price">
                      {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : '-'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .wrap {
          max-width: 1150px;
          margin: 0 auto;
          padding: 16px 18px 40px;
        }
        .headRow {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 8px;
        }
        h1 {
          font-size: 28px;
          margin: 0;
        }
        .spacer { flex: 1; }
        .allLink {
          color: #1f5376;
          text-decoration: underline;
          font-weight: 600;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 10px 0 18px;
          flex-wrap: wrap;
        }
        .chk {
          display: inline-flex;
          align-items: center;
        }
        .applyBtn {
          border: 1px solid #1f5376;
          background: #1f5376;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
        }
        .empty { margin: 24px 0; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 3px 12px rgba(0,0,0,.04);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .imgBox {
          position: relative;
          width: 100%;
          /* square box to avoid cropping, image uses object-fit: contain */
          padding-top: 100%;
          overflow: hidden;
          background: #f6f6f6;
          border-radius: 8px;
        }
        .noImg {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #777;
          font-size: 14px;
        }
        .meta { display: grid; gap: 8px; }
        .name {
          font-size: 14px;
          line-height: 1.25;
          margin: 0 0 6px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }
        .code {
          color: #6b7280;
          font-size: 12px;
        }
        .price {
          color: #0b5;
          font-weight: 700;
        }
      `}</style>
    </>
  )
}