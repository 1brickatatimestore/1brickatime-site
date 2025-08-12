import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCart } from '@/context/CartContext'

type Item = {
  _id?: string
  inventoryId?: number
  name?: string
  itemNo?: string
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
  theme?: string
}

export default function MinifigsPage({ items, count, page, limit, theme }: Props) {
  const router = useRouter()
  const { add } = useCart()
  const totalPages = Math.max(1, Math.ceil(count / Math.max(1, limit)))

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
      <main>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {items.map((p) => (
            <article key={p._id || p.inventoryId}>
              <Link href={`/minifig/${p.inventoryId || p._id}`}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name || p.itemNo || 'Minifig'} fill style={{ objectFit: 'contain' }} />
                  ) : (
                    <div>No image</div>
                  )}
                </div>
              </Link>
              <div>{p.name || p.itemNo}</div>
              <button
                onClick={() =>
                  add({
                    id: p._id || String(p.inventoryId),
                    name: p.name || p.itemNo || 'Minifig',
                    price: Number(p.price || 0),
                    qty: 1,
                    imageUrl: p.imageUrl,
                  })
                }
              >
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      </main>
    </>
  )
}