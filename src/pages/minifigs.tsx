import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import type { GetServerSideProps } from 'next'
import { decode } from 'html-entities'

type Item = {
  inventoryId?: number | null
  itemNo?: string | null
  name: string
  condition?: string | null
  description?: string | null
  remarks?: string | null
  price?: number | null
  qty?: number | null
  imageUrl?: string | null
  type?: string | null
  categoryId?: number | null
}

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  type: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ctx => {
  const type  = (ctx.query.type as string) || 'MINIFIG'
  const page  = Math.max(1, parseInt((ctx.query.page as string) || '1', 10))
  const limit = Math.min(
    100,
    Math.max(1, parseInt((ctx.query.limit as string) || '36', 10))
  )

  const SITE =
    process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'

  const url = `${SITE}/api/minifigs?type=${encodeURIComponent(
    type
  )}&page=${page}&limit=${limit}`

  const res = await fetch(url)
  const data = await res.json()

  return {
    props: {
      items: Array.isArray(data.inventory) ? data.inventory : [],
      count: Number(data.count || 0),
      page,
      limit,
      type,
    },
  }
}

export default function MinifigsPage({ items, count, page, limit, type }: Props) {
  const totalPages = Math.max(1, Math.ceil(count / limit))
  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  return (
    <>
      <Head>
        <title>{`Inventory: ${type}`}</title>
        <meta name="description" content="Browse BrickLink inventory" />
      </Head>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* Simple nav */}
        <nav style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Link href="/" legacyBehavior><a>Home</a></Link>
          <Link href="/minifigs?type=MINIFIG&limit=36" legacyBehavior><a>Minifigs</a></Link>
          <Link href="/minifigs?limit=36&type=PART" legacyBehavior><a>Parts</a></Link>
        </nav>

        <h1 style={{ fontSize: 32, margin: '8px 0 4px' }}>
          {`Inventory: ${type}`}
        </h1>
        <div style={{ color: '#555', marginBottom: 16 }}>
          {`Total ${count} • Page ${page} / ${totalPages} • Showing ${items.length}`}
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((item, idx) => {
            const key =
              item.inventoryId ??
              (item.itemNo ? `${item.itemNo}-${idx}` : `row-${idx}`)
            const name = decode(item.name || '—')
            return (
              <div
                key={key}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fff',
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: '#f3f3f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={name}
                      width={400}
                      height={400}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: '#888' }}>No Image</span>
                  )}
                </div>

                {/* Text */}
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{name}</div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  {item.condition ?? '—'} • Qty: {item.qty ?? 0}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>
                  <strong>Description:</strong>{' '}
                  {item.description ? decode(item.description) : '—'}
                </div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  <strong>Remarks:</strong> {item.remarks ? decode(item.remarks) : '—'}
                </div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>
                  {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Link
            href={`/minifigs?type=${encodeURIComponent(
              type
            )}&limit=${limit}&page=${prevPage}`}
            legacyBehavior
          >
            <a aria-disabled={page <= 1} style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.5 : 1 }}>
              ← Prev
            </a>
          </Link>
          <span style={{ color: '#666' }}>
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/minifigs?type=${encodeURIComponent(
              type
            )}&limit=${limit}&page=${nextPage}`}
            legacyBehavior
          >
            <a aria-disabled={page >= totalPages} style={{ pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.5 : 1 }}>
              Next →
            </a>
          </Link>
        </div>
      </div>
    </>
  )
}