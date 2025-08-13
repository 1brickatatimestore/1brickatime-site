import Head from 'next/head'
import Image from 'next/image'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  condition?: string
  imageUrl?: string
  description?: string
  remarks?: string
  qty?: number
  createdAt?: string
  updatedAt?: string
}

type Props = { item: Item }

export default function MinifigDetail({ item }: Props) {
  const titleBase = item?.name || item?.itemNo || 'Minifig'
  const title = `${titleBase} — 1 Brick at a Time`

  const para = (text?: string) =>
    (text || '')
      .split(/\r?\n/)
      .map((line, idx) => (
        <p key={idx} style={{ margin: '6px 0' }}>
          {line}
        </p>
      ))

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={item?.description || item?.remarks || titleBase} />
      </Head>

      <main className="wrap">
        <article className="card">
          <div className="imgBox">
            {item?.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name || item.itemNo || 'Minifig'}
                fill
                sizes="(max-width: 900px) 80vw, 400px"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="noImg">No image</div>
            )}
          </div>

          <div className="info">
            <h1 className="name">{item?.name || item?.itemNo || 'Minifig'}</h1>
            <div className="meta">
              {item?.itemNo && <span>#{item.itemNo}</span>}
              {typeof item?.price === 'number' && <span>${item.price.toFixed(2)}</span>}
              {item?.condition && <span>{item.condition}</span>}
              {typeof item?.qty === 'number' && <span>Qty: {item.qty}</span>}
            </div>

            {item?.description && (
              <>
                <h3>Description</h3>
                <div className="text">{para(item.description)}</div>
              </>
            )}

            {item?.remarks && (
              <>
                <h3>Remarks</h3>
                <div className="text">{para(item.remarks)}</div>
              </>
            )}
          </div>
        </article>
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1100px; }
        .card { display:grid; grid-template-columns: minmax(260px, 420px) 1fr; gap:20px; align-items:start; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .info { display:flex; flex-direction:column; gap:10px; }
        .name { margin:0; font-size:22px; line-height:1.2; }
        .meta { display:flex; flex-wrap:wrap; gap:8px; color:#333; font-weight:600; }
        .text :global(p){ margin:6px 0; color:#1b1b1b; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:14px 16px 110px; } .card{ grid-template-columns:1fr; } }
      `}</style>
    </>
  )
}

export async function getServerSideProps(ctx: any) {
  const { id } = ctx.params || {}
  if (!id) return { notFound: true }

  const isNumeric = /^\d+$/.test(String(id))
  await dbConnect(process.env.MONGODB_URI!)

  // Try both: numeric inventoryId OR Mongo _id
  let doc =
    isNumeric
      ? await Product.findOne({ inventoryId: Number(id) }).lean()
      : await Product.findById(id).lean()

  if (!doc && isNumeric) {
    // Fallback: sometimes inventoryId is stored as string
    doc = await Product.findOne({ inventoryId: String(id) }).lean()
  }

  if (!doc) return { notFound: true }

  // Serialize dates safely; leave image exactly as-is
  const item: Item = {
    _id: doc._id?.toString?.() ?? doc._id,
    inventoryId: typeof doc.inventoryId === 'number' ? doc.inventoryId : Number(doc.inventoryId ?? 0) || undefined,
    itemNo: doc.itemNo,
    name: doc.name,
    price: typeof doc.price === 'number' ? doc.price : Number(doc.price ?? 0),
    condition: doc.condition,
    imageUrl: doc.imageUrl,
    description: doc.description,
    remarks: doc.remarks,
    qty: typeof doc.qty === 'number' ? doc.qty : Number(doc.qty ?? 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  }

  return { props: { item } }
}