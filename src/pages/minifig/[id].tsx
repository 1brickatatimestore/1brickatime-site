import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import { useCart } from '@/context/CartContext'

type Item = {
  _id: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  condition?: string | null
  qty?: number | null
  imageUrl?: string | null
  remarks?: string | null
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

type Props = { item: Item | null }

export default function MinifigDetail({ item }: Props) {
  const { add } = useCart()

  if (!item) {
    return (
      <>
        <Head>
          <title>{`Minifig not found — 1 Brick at a Time`}</title>
        </Head>
        <main className="wrap">
          <p className="empty">Sorry, we couldn’t find that minifig.</p>
          <Link className="btn" href="/minifigs">Back to Minifigs</Link>
        </main>
        <style jsx>{`
          .wrap{ margin-left:64px; padding:22px 22px 120px; }
          .empty{ margin:10px 0 16px; color:#333; }
          .btn{ display:inline-block; border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:700; }
        `}</style>
      </>
    )
  }

  const photo = item.imageUrl || ''
  const price = Number(item.price ?? 0)

  return (
    <>
      <Head>
        <title>{`${item.name || item.itemNo || 'Minifig'} — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <nav className="crumbs">
          <Link href="/minifigs">← Back to Minifigs</Link>
        </nav>

        <article className="sheet">
          <div className="photo">
            {photo ? (
              <Image
                src={photo}
                alt={item.name || item.itemNo || 'Minifig'}
                fill
                sizes="(max-width: 900px) 90vw, 520px"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="noImg">No image</div>
            )}
          </div>

          <div className="meta">
            <h1 className="title">{item.name || item.itemNo || 'Minifig'}</h1>
            <div className="sku">
              {item.itemNo}
              {item.condition ? ` • ${item.condition}` : ''}
            </div>

            <div className="priceRow">
              <strong className="price">${price.toFixed(2)}</strong>
              <button
                className="addBtn"
                onClick={() =>
                  add({
                    id: item.inventoryId ? String(item.inventoryId) : item._id,
                    name: item.name ?? item.itemNo ?? 'Minifig',
                    price,
                    qty: 1,
                    imageUrl: photo || undefined,
                  })
                }
              >
                Add to cart
              </button>
            </div>

            {(item.remarks || item.description) && (
              <section className="desc">
                <h2>Description</h2>
                <p className="text">
                  {(item.remarks || item.description || '')
                    .toString()
                    .replace(/\r\n/g, '\n')
                    .split('\n')
                    .map((line, i) => <span key={i}>{line}<br/></span>)}
                </p>
              </section>
            )}
          </div>
        </article>
      </main>

      <style jsx>{`
        .wrap{ margin-left:64px; padding:22px 22px 120px; max-width:1200px; }
        .crumbs a{ color:#204d69; font-weight:700; }
        .sheet{ display:grid; grid-template-columns: 520px 1fr; gap:22px; align-items:start; }
        .photo{ position:relative; width:100%; aspect-ratio:1/1; background:#f7f5f2; border-radius:12px; overflow:hidden; }
        .noImg{ position:absolute; inset:0; display:grid; place-items:center; color:#666; }
        .meta{ display:flex; flex-direction:column; gap:10px; }
        .title{ margin:0; font-size:24px; line-height:1.15; color:#1e1e1e; }
        .sku{ color:#555; font-weight:600; }
        .priceRow{ display:flex; align-items:center; gap:14px; margin-top:6px; }
        .price{ font-size:22px; color:#1a1a1a; }
        .addBtn{ background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 14px; border-radius:10px; font-weight:800; }
        .desc{ margin-top:12px; }
        .desc h2{ font-size:16px; margin:0 0 6px; }
        .text{ color:#2a2a2a; white-space:pre-wrap; }
        @media (max-width:1000px){
          .sheet{ grid-template-columns:1fr; }
          .photo{ max-width:520px; }
        }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { id } = ctx.params as { id: string }

  await dbConnect(process.env.MONGODB_URI as string)

  // Accept numeric inventoryId and/or Mongo _id
  const or: any[] = []
  const n = Number(id)
  if (!Number.isNaN(n)) or.push({ inventoryId: n })
  if (mongoose.isValidObjectId(id)) {
    or.push({ _id: new mongoose.Types.ObjectId(id) })
  }

  // If neither is valid, force a miss
  const doc = await Product.findOne(or.length ? { $or: or } : { _id: null }).lean()

  if (!doc) return { props: { item: null } }

  // Make all values JSON-serializable (Dates -> ISO strings, no ObjectIds, etc.)
  const item: Item = {
    _id: String(doc._id),
    inventoryId: typeof doc.inventoryId === 'number' ? doc.inventoryId : null,
    itemNo: doc.itemNo ?? null,
    name: doc.name ?? null,
    price: typeof doc.price === 'number' ? doc.price : null,
    condition: doc.condition ?? null,
    qty: typeof doc.qty === 'number' ? doc.qty : null,
    imageUrl: doc.imageUrl ?? null, // keep photos exactly as stored
    remarks: (doc as any).remarks ?? (doc as any).blRemarks ?? null,
    description: (doc as any).description ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  }

  return { props: { item } }
}