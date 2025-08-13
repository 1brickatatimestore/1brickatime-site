import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import { useCart } from '@/context/CartContext'

type Item = {
  _id: string
  inventoryId?: number
  itemNo: string
  name: string
  imageUrl: string
  price: number
  condition?: string
  qty: number
  remarks?: string | null
  description?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type PageProps = { item: Item | null }

export default function MinifigDetailPage({ item }: PageProps) {
  const { add } = useCart()

  if (!item) {
    return (
      <main className="wrap">
        <p>Sorry, that minifig was not found.</p>
        <Link className="btn" href="/minifigs">Back to Minifigs</Link>
        <style jsx>{`.wrap{padding:24px}.btn{padding:8px 12px;border:1px solid #d0c6b9;border-radius:10px;background:#e7c36a}`}</style>
      </main>
    )
  }

  return (
    <>
      <Head><title>{item.name} — 1 Brick at a Time</title></Head>
      <main className="wrap">
        <Link className="back" href="/minifigs">← Back to Minifigs</Link>

        <section className="card">
          <div className="left">
            <div className="thumb">
              <img src={item.imageUrl} alt={item.name} />
            </div>
          </div>

          <div className="right">
            <h1 className="title">{item.name}</h1>
            <div className="sku">#{item.itemNo}</div>

            <div className="priceRow">
              <div className="price">${item.price.toFixed(2)}</div>
              {item.condition && <div className="cond">{item.condition}</div>}
              {typeof item.qty === 'number' && <div className="qty">{item.qty} in stock</div>}
            </div>

            {item.remarks && (
              <div className="block">
                <h3>Remarks</h3>
                <p className="text">{item.remarks}</p>
              </div>
            )}

            {item.description && (
              <div className="block">
                <h3>Description</h3>
                <p className="text">{item.description}</p>
              </div>
            )}

            <div className="row">
              <button
                className="btn"
                onClick={() => add({
                  id: (item.inventoryId ?? item._id).toString(),
                  itemNo: item.itemNo,
                  name: item.name,
                  price: item.price,
                  imageUrl: item.imageUrl,
                  qty: 1,
                  maxQty: Math.max(0, item.qty ?? 0),
                })}
              >
                Add to cart
              </button>
              <Link className="btn ghost" href="/checkout">Go to checkout</Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .wrap { padding: 24px 16px; max-width: 1100px; margin: 0 auto; }
        .back { display:inline-block; margin-bottom: 12px; }

        .card { display: grid; grid-template-columns: 420px 1fr; gap: 24px; background:#f6efe6; border:1px solid #e3d9cc; border-radius: 14px; padding: 16px; }
        @media (max-width: 900px){ .card{grid-template-columns: 1fr} }

        .thumb { width: 100%; aspect-ratio: 1/1; border:1px solid #eadfce; border-radius: 12px; background: #fff; display:grid; place-items:center; overflow:hidden; }
        .thumb img { width: 94%; height: 94%; object-fit: contain; }

        .title { margin: 0 0 6px 0; font-size: 24px; line-height: 1.25; }
        .sku { color:#6b6259; margin-bottom: 10px; }
        .priceRow { display:flex; gap:12px; align-items:center; margin: 8px 0 16px; }
        .price { font-size: 22px; font-weight: 700; }
        .cond, .qty { font-size: 14px; color:#4b463f; }

        .block h3 { margin: 14px 0 6px; }
        .text { white-space: pre-wrap; }

        .row { display:flex; gap: 8px; margin-top: 16px; }
        .btn { cursor:pointer; padding: 10px 14px; border-radius: 10px; border:1px solid #d0c6b9; background:#e7c36a; }
        .btn.ghost { background:#fff; }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params }) => {
  await dbConnect()
  const id = String(params?.id || '')
  const isNumeric = /^\d+$/.test(id)

  let doc = null
  if (isNumeric) {
    doc = await Product.findOne({ inventoryId: Number(id) }).lean()
  } else {
    // Try by Mongo _id first; fall back to itemNo if user pasted a number like "sw0123"
    doc = await Product.findOne({ _id: id }).lean().catch(() => null)
    if (!doc) doc = await Product.findOne({ itemNo: id }).lean()
  }

  const item = doc ? {
    _id: String(doc._id),
    inventoryId: doc.inventoryId ?? null,
    itemNo: doc.itemNo,
    name: doc.name,
    imageUrl: doc.imageUrl,
    price: doc.price,
    condition: doc.condition ?? null,
    qty: typeof doc.qty === 'number' ? doc.qty : 0,
    remarks: doc.remarks ?? null,
    description: doc.description ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  } : null

  return { props: { item } }
}