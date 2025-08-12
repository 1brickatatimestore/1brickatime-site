import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import mongoose from 'mongoose'
import { useCart } from '@/context/CartContext'

type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  condition?: string
  imageUrl?: string
  // any other plain JSON fields are fine
}

const Product =
  mongoose.models.Product ||
  mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products')

/** Convert any Dates/ObjectIds/BigInts to simple JSON values */
function toJSONSafe<T>(v: T): T {
  return JSON.parse(
    JSON.stringify(v, (_, val) => {
      // Date -> ISO string
      if (val instanceof Date) return val.toISOString()
      // Mongo ObjectId (from .lean())
      if (val && typeof val === 'object') {
        // Most drivers expose toHexString or toString that returns the id.
        // We prefer the 24-hex string if available.
        // @ts-ignore
        if (typeof val.toHexString === 'function') return val.toHexString()
        // @ts-ignore
        if (val._bsontype === 'ObjectID' && typeof val.toString === 'function') return String(val)
      }
      // BigInt -> number
      if (typeof val === 'bigint') return Number(val)
      return val
    })
  )
}

export default function MinifigDetail({ item }: { item: Item }) {
  const { add } = useCart()

  if (!item) {
    return (
      <main style={{ marginLeft: 64, padding: '24px' }}>
        <p>Minifig not found.</p>
        <p>
          <Link href="/minifigs">← Back to Minifigs</Link>
        </p>
      </main>
    )
  }

  const price = Number(item.price ?? 0)

  return (
    <>
      <Head>
        <title>{`${item.name || item.itemNo || 'Minifig'} — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <Link href="/minifigs" className="back">← Back to Minifigs</Link>

        <section className="card">
          <div className="imgBox">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name || item.itemNo || 'Minifig'}
                fill
                sizes="(max-width: 900px) 90vw, 360px"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="noImg">No image</div>
            )}
          </div>

          <div className="info">
            <h1 className="title">{item.name || item.itemNo || 'Minifig'}</h1>
            <p className="sku">{item.itemNo ? `#${item.itemNo}` : item.inventoryId ? `Inventory ${item.inventoryId}` : ''}</p>

            <p className="price">
              ${price.toFixed(2)} {item.condition ? `• ${item.condition}` : ''}
            </p>

            <div className="actions">
              <button
                className="addBtn"
                onClick={() =>
                  add({
                    id: item.inventoryId ? String(item.inventoryId) : (item._id as string),
                    name: item.name ?? item.itemNo ?? 'Minifig',
                    price: price,
                    qty: 1,
                    imageUrl: item.imageUrl,
                  })
                }
              >
                Add to cart
              </button>
              <Link href="/checkout" className="goCheckout">Go to checkout</Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:20px 22px 120px; max-width:1150px; }
        .back { display:inline-block; margin-bottom:12px; color:#204d69; }
        .card { display:grid; grid-template-columns: 360px 1fr; gap:24px; background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(0,0,0,.08); }
        .imgBox { position:relative; width:100%; aspect-ratio:1/1; background:#f7f5f2; border-radius:12px; overflow:hidden; }
        .noImg{ position:absolute; inset:0; display:grid; place-items:center; color:#666; }
        .info { display:flex; flex-direction:column; gap:10px; }
        .title { margin:0; font-size:24px; line-height:1.2; }
        .sku { color:#666; margin:0; }
        .price { font-weight:800; font-size:18px; margin:10px 0; }
        .actions { display:flex; gap:10px; flex-wrap:wrap; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 14px; border-radius:10px; font-weight:800; }
        .goCheckout { border:2px solid #204d69; color:#204d69; padding:10px 14px; border-radius:10px; font-weight:700; }
        @media (max-width:900px){ .card{ grid-template-columns:1fr; } .wrap{ padding:16px 16px 110px; } }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.params as { id: string }

  if (!process.env.MONGODB_URI) {
    return { notFound: true }
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI)
  }

  // Figure out how to look up the item:
  // - numeric -> inventoryId
  // - 24-hex -> _id
  // - otherwise, try itemNo or fallback
  const isNumeric = /^\d+$/.test(id)
  const isHex24 = /^[0-9a-fA-F]{24}$/.test(id)

  const or: any[] = []
  if (isNumeric) or.push({ inventoryId: Number(id) })
  if (isHex24) or.push({ _id: new mongoose.Types.ObjectId(id) })
  // Useful fallback
  or.push({ itemNo: id })

  const doc = await Product.findOne({ $or: or }, {
    _id: 1, inventoryId: 1, itemNo: 1, name: 1, price: 1, condition: 1, imageUrl: 1
  }).lean().exec()

  if (!doc) return { notFound: true }

  const item: Item = toJSONSafe(doc)
  return { props: { item } }
}