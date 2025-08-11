import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { decode } from 'html-entities'

type Item = {
  inventoryId?: number | null
  type?: string | null
  categoryId?: number | null
  itemNo?: string | null
  name?: string | null
  condition?: string | null
  description?: string | null
  remarks?: string | null
  price?: number | null
  qty?: number | null
  imageUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

type Props = {
  items: Item[]
  count: number
  page: number
  limit: number
  type: string
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const q = ctx.query

  const typeParam =
    typeof q.type === 'string' && q.type.trim() !== '' ? q.type : 'MINIFIG'

  const limit = Number.parseInt(String(q.limit ?? '36'), 10) || 36
  const page  = Math.max(1, Number.parseInt(String(q.page ?? '1'), 10) || 1)
  const skip  = (page - 1) * limit

  const host = ctx.req.headers.host ?? 'localhost:3000'
  const isLocal = host.startsWith('localhost') || host.startsWith('192.168.')
  const proto = isLocal ? 'http' : 'https'

  const url =
    `${proto}://${host}/api/minifigs` +
    `?type=${encodeURIComponent(typeParam)}` +
    `&limit=${limit}` +
    `&skip=${skip}`

  const res  = await fetch(url)
  const data = await res.json().catch(() => ({}))

  const items: Item[] = Array.isArray(data?.inventory) ? data.inventory : Array.isArray(data) ? data : []
  const count: number = Number.isFinite(data?.count) ? data.count : items.length

  return {
    props: { items, count, page, limit, type: typeParam },
  }
}

export default function MinifigsPage({ items, count, page, limit, type }: Props) {
  const totalPages = Math.max(1, Math.ceil(count / limit))
  const title = `Inventory — ${type} (${count})`

  const pageHref = (p: number) =>
    `/minifigs?type=${encodeURIComponent(type)}&limit=${limit}&page=${p}`

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <main style={{ padding: 24 }}>
        <header style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
            {type} <span style={{ opacity: 0.6 }}>({count} total)</span>
          </h1>

          {/* Quick type switchers (keeps your default to MINIFIG) */}
          <nav style={{ display: 'flex', gap: 10 }}>
            <Link href={`/minifigs?type=MINIFIG&limit=${limit}`}>Minifigs</Link>
            <Link href={`/minifigs?limit=${limit}`}>All Types</Link>
          </nav>
        </header>

        {/* Grid */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((it) => {
            const name = decode(it.name ?? '') || '(no name)'
            const price =
              it.price != null ? `$${Number(it.price).toFixed(2)}` : '—'
            const qty = it.qty ?? 0

            const imgSrc =
              it.imageUrl && it.imageUrl.trim() !== ''
                ? it.imageUrl
                : 'https://via.placeholder.com/300x300?text=No+Image'

            return (
              <li
                key={String(it.inventoryId ?? `${it.itemNo}-${it.name}`)}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 8 }}>
                  {/* Next/Image with fixed layout to avoid legacy props */}
                  <Image
                    src={imgSrc}
                    alt={name}
                    fill
                    sizes="(max-width: 600px) 50vw, 240px"
                    style={{ objectFit: 'contain' }}
                    unoptimized={imgSrc.startsWith('http')}
                  />
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {it.itemNo ?? '—'} • {it.condition ?? '—'} • Qty {qty}
                  </div>
                  <div style={{ fontWeight: 700 }}>{price}</div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Pager */}
        <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ opacity: 0.7 }}>
            Page {page} / {totalPages}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href={page > 1 ? pageHref(page - 1) : pageHref(1)} aria-disabled={page <= 1}>
              ← Prev
            </Link>
            <Link href={page < totalPages ? pageHref(page + 1) : pageHref(totalPages)} aria-disabled={page >= totalPages}>
              Next →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}