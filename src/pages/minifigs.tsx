import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useCart } from '@/context/CartContext'

type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  condition?: string
  price?: number
  qty?: number
  imageUrl?: string
}

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  q?: string
  condition?: string
  priceMin?: string
  priceMax?: string
  theme?: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, query }) => {
  const base =
    process. PAYPAL_CLIENT_SECRET_REDACTED||
    `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`

  const params = new URLSearchParams()
  params.set('type', 'MINIFIG')
  params.set('page', String(query.page || 1))
  params.set('limit', String(query.limit || 36))
  if (query.q) params.set('q', String(query.q))
  if (query.condition) params.set('condition', String(query.condition))
  if (query.priceMin) params.set('priceMin', String(query.priceMin))
  if (query.priceMax) params.set('priceMax', String(query.priceMax))
  if (query.theme) params.set('theme', String(query.theme))

  const res = await fetch(`${base}/api/products?${params.toString()}`, { headers: { accept: 'application/json' } })
  const json = await res.json()

  return {
    props: {
      items: json.items || [],
      count: json.count || 0,
      page: Number(json.page || 1),
      limit: Number(json.limit || 36),
      q: String(query.q || ''),
      condition: String(query.condition || ''),
      priceMin: String(query.priceMin || ''),
      priceMax: String(query.priceMax || ''),
      theme: String(query.theme || ''),
    },
  }
}

export default function MinifigsPage({ items, count, page, limit, q, condition, priceMin, priceMax, theme }: Props) {
  const router = useRouter()
  const { add } = useCart()
  const totalPages = Math.max(1, Math.ceil(count / Math.max(1, limit)))

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    params.set('type', 'MINIFIG')
    params.set('limit', String(limit))
    const qv = String(fd.get('q') || '')
    if (qv) params.set('q', qv)
    const cond = String(fd.get('condition') || '')
    if (cond) params.set('condition', cond)
    const pmin = String(fd.get('priceMin') || '')
    if (pmin) params.set('priceMin', pmin)
    const pmax = String(fd.get('priceMax') || '')
    if (pmax) params.set('priceMax', pmax)
    if (theme) params.set('theme', theme)
    router.push(`/minifigs?${params.toString()}`)
  }

  const goPage = (n: number) => {
    const params = new URLSearchParams(router.query as any)
    params.set('page', String(n))
    router.push(`/minifigs?${params.toString()}`)
  }

  return (
    <>
      <Head>
        <title>Minifigs — {count} items</title>
      </Head>

      <main style={{ marginLeft: 'var(--rail-w, 64px)', padding: 24 }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or item number…"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #b9c6cf', minWidth: 260 }}
          />
          <select
            name="condition"
            defaultValue={condition || ''}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #b9c6cf' }}
          >
            <option value="">All</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>
          <input
            name="priceMin"
            defaultValue={priceMin}
            placeholder="Min $"
            inputMode="decimal"
            style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid #b9c6cf' }}
          />
          <input
            name="priceMax"
            defaultValue={priceMax}
            placeholder="Max $"
            inputMode="decimal"
            style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid #b9c6cf' }}
          />
          <button type="submit" className="applyBtn" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #204d69', background: '#204d69', color: '#fff' }}>
            Apply
          </button>
        </form>

        <div style={{ marginBottom: 10, color: '#1f1f1f' }}>
          {count} items {theme ? `(Theme: ${theme})` : ''}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {items.map((p) => {
            const key = p.inventoryId ? String(p.inventoryId) : (p._id as string)
            const price = Number(p.price || 0)
            return (
              <article key={key} style={{ background: '#fff', borderRadius: 12, padding: 10, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <Link
                  href={`/minifig/${p.inventoryId ? String(p.inventoryId) : (p._id as string)}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f6f6f6', borderRadius: 8, overflow: 'hidden' }}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name || p.itemNo || 'Minifig'}
                        fill
                        sizes="(max-width: 900px) 50vw, 240px"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#888' }}>No image</div>
                    )}
                  </div>
                </Link>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name || p.itemNo}</div>
                  <div style={{ fontSize: 13, color: '#2a2a2a', marginBottom: 8 }}>
                    {p.itemNo} · {(p.condition || 'U').toUpperCase()} · ${price.toFixed(2)}
                  </div>
                  <button
                    className="addBtn"
                    onClick={() =>
                      add({
                        id: p.inventoryId ? String(p.inventoryId) : (p._id as string),
                        name: p.name ?? p.itemNo ?? 'Minifig',
                        price,
                        qty: 1,
                        imageUrl: p.imageUrl,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '2px solid #a2801a',
                      background: '#e1b946',
                      color: '#1a1a1a',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
            <button
              onClick={() => goPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ccd6dd', background: '#fff' }}
            >
              ‹ Prev
            </button>
            <div style={{ padding: '8px 10px' }}>
              Page {page} / {totalPages}
            </div>
            <button
              onClick={() => goPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ccd6dd', background: '#fff' }}
            >
              Next ›
            </button>
          </div>
        )}
      </main>
    </>
  )
}