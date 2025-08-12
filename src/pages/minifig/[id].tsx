import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'
import { GetServerSideProps } from 'next'
import { useCart } from '@/context/CartContext'
import { useState } from 'react'

type P = {
  _id: string
  inventoryId: number
  itemNo: string | null
  name: string | null
  price: number | null
  imageUrl: string | null
  condition: string | null
  remarks: string | null
  description: string | null
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string
  if (!id) return { notFound: true }

  await dbConnect(process.env.MONGODB_URI!)
  const doc = await Product.findOne({ inventoryId: Number(id) }).lean()

  if (!doc) return { notFound: true }

  const p: P = {
    _id: String(doc._id),
    inventoryId: doc.inventoryId ?? 0,
    itemNo: doc.itemNo ?? null,
    name: doc.name ?? null,
    price: doc.price ?? null,
    imageUrl: doc.imageUrl ?? null,
    condition: doc.condition ?? null,
    remarks: doc.remarks ?? null,
    description: doc.description ?? null,
  }

  return { props: { p } }
}

export default function MinifigDetail({ p }: { p: P }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)

  const title = p.name ? `${p.name} – ${p.itemNo ?? ''}` : (p.itemNo ?? 'Minifig')

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:24, alignItems:'start' }}>
        <div style={{
          position:'relative', width:320, height:320,
          borderRadius:12, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.08)',
          display:'grid', placeItems:'center'
        }}>
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.name || p.itemNo || 'Minifig'}
              fill
              sizes="320px"
              style={{ objectFit:'contain' }}
            />
          ) : (
            <div style={{ color:'#999' }}>No image</div>
          )}
        </div>

        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28 }}>{p.name || p.itemNo}</h1>
          <div style={{ margin:'0 0 16px', color:'#555' }}>{p.itemNo}</div>

          <div style={{ display:'flex', gap:12, alignItems:'center', margin:'0 0 18px' }}>
            <div style={{ fontSize:24, fontWeight:800 }}>
              {p.price != null ? `$${p.price.toFixed(2)}` : 'Price TBA'}
            </div>
            {p.condition && (
              <span style={{ padding:'4px 8px', border:'1px solid #999', borderRadius:6 }}>
                {p.condition === 'N' ? 'New' : p.condition === 'U' ? 'Used' : p.condition}
              </span>
            )}
            {p.remarks && (
              <span style={{ color:'#777' }}>Ref: {p.remarks}</span>
            )}
          </div>

          {p.description && (
            <p style={{ margin:'0 0 18px', maxWidth:700 }}>{p.description}</p>
          )}

          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              Qty
              <input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                style={{ width:70, padding:'8px 10px', borderRadius:8, border:'1px solid #bbb' }}
              />
            </label>

            <button
              onClick={() => addItem({
                id: String(p.inventoryId),
                itemNo: p.itemNo,
                name: p.name,
                price: p.price ?? 0,
                imageUrl: p.imageUrl
              }, qty)}
              style={{
                background:'#e1b946', border:'2px solid #a2801a', color:'#1a1a1a',
                fontWeight:800, padding:'10px 16px', borderRadius:8, cursor:'pointer'
              }}
            >
              Add to Cart
            </button>

            <Link href="/checkout" style={{
              padding:'10px 16px', border:'2px solid #204d69', borderRadius:8, color:'#204d69', fontWeight:700
            }}>Go to Checkout</Link>
          </div>

          <div style={{ marginTop:24 }}>
            <Link href={`/minifigs?type=MINIFIG&limit=36`}>← Back to Minifigs</Link>
          </div>
        </div>
      </div>
    </>
  )
}