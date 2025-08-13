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
  price?: number
  condition?: string
  imageUrl?: string
  remarks?: string
  description?: string
}

type Props = { item: Item | null }

export default function MinifigDetail({ item }: Props) {
  const router = useRouter()
  const { add } = useCart()

  if (!item) {
    return (
      <main className="wrap">
        <p>Item not found.</p>
        <p><Link href="/minifigs">Back to minifigs</Link></p>
      </main>
    )
  }

  const id = item.inventoryId ? String(item.inventoryId) : (item._id as string)

  return (
    <>
      <Head><title>{item.name || item.itemNo || 'Minifig'} — 1 Brick at a Time</title></Head>
      <main className="wrap">
        <nav className="crumbs">
          <Link href="/minifigs">← Back to minifigs</Link>
        </nav>

        <section className="detail">
          <div className="imgBox">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name || item.itemNo || 'Minifig'}
                fill
                sizes="(max-width: 900px) 90vw, 480px"
                style={{ objectFit: 'contain' }}
              />
            ) : <div className="noImg">No image</div>}
          </div>

          <div className="info">
            <h1 className="title">{item.name || item.itemNo}</h1>
            <div className="priceLine">
              <span className="price">${Number(item.price ?? 0).toFixed(2)}</span>
              {item.condition && <span className="cond">• {item.condition}</span>}
            </div>

            {(item.description || item.remarks) && (
              <div className="desc">
                {item.description && <p dangerouslySetInnerHTML={{ __html: item.description }} />}
                {item.remarks && <p dangerouslySetInnerHTML={{ __html: item.remarks }} />}
              </div>
            )}

            <div className="actions">
              <button
                className="addBtn"
                onClick={() =>
                  add({
                    id,
                    name: item.name ?? item.itemNo ?? 'Minifig',
                    price: Number(item.price ?? 0),
                    qty: 1,
                    imageUrl: item.imageUrl,
                  })
                }
              >
                Add to cart
              </button>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1200px; }
        .crumbs { margin:4px 0 16px; }
        .detail { display:grid; grid-template-columns: 1fr 1fr; gap:24px; align-items:start; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:12px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; }
        .title { margin:0 0 8px; font-size:22px; }
        .priceLine { font-size:18px; margin-bottom:12px; }
        .price { font-weight:800; }
        .cond { color:#444; }
        .desc p { margin:0 0 8px; color:#222; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 16px; border-radius:10px; font-weight:800; cursor:pointer; }
        @media (max-width:900px){ .detail{ grid-template-columns:1fr; } .wrap{ margin-left:64px; } }
      `}</style>
    </>
  )
}

export async function getServerSideProps(ctx: any) {
  const { req, query } = ctx
  const id = String(query.id || '')
  const host = req?.headers?.host || 'localhost:3000'
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'http'

  async function fetchTry(url: string) {
    const r = await fetch(url)
    if (!r.ok) return null
    const j = await r.json()
    const arr =
      (Array.isArray(j.items) && j.items) ||
      (Array.isArray(j.inventory) && j.inventory) ||
      (Array.isArray(j.results) && j.results) || []
    return { raw: j, arr }
  }

  let found: Item | null = null

  // Try inventoryId filter
  const f1 = await fetchTry(`${proto}://${host}/api/products?inventoryId=${encodeURIComponent(id)}&includeSoldOut=1&limit=1`)
  if (f1?.arr?.[0]) found = f1.arr[0]

  // Try Mongo _id
  if (!found) {
    const f2 = await fetchTry(`${proto}://${host}/api/products?_id=${encodeURIComponent(id)}&includeSoldOut=1&limit=1`)
    if (f2?.arr?.[0]) found = f2.arr[0]
  }

  // Fallback: broad search, then exact match by id
  if (!found) {
    const f3 = await fetchTry(`${proto}://${host}/api/products?q=${encodeURIComponent(id)}&includeSoldOut=1&limit=50`)
    const m = f3?.arr?.find((x: any) =>
      String(x.inventoryId ?? '') === id || String(x._id ?? '') === id || String(x.itemNo ?? '') === id
    )
    if (m) found = m as Item
  }

  if (!found) return { props: { item: null } }
  return { props: { item: found } }
}