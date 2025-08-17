// src/pages/minifig/[id].tsx
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type P = {
  _id: string
  itemNo: string | null
  name: string | null
  price: number | null
  qty: number | null
  type: string | null
  imageUrl: string | null
}

type Props = { p: P }

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { id } = ctx.query
  await dbConnect(process.env.MONGODB_URI!)

  const key = String(id ?? '')
  const looksLikeObjectId = /^[0-9a-f]{24}$/i.test(key)

  const match = looksLikeObjectId
    ? { _id: new mongoose.Types.ObjectId(key) }
    : { itemNo: key }

  const doc = await Product.findOne(match).lean()

  if (!doc) {
    return { notFound: true }
  }

  const out: P = {
    _id: String(doc._id),
    itemNo: doc.itemNo ?? null,
    name: doc.name ?? null,
    price: typeof doc.price === 'number' ? doc.price : null,
    qty: typeof doc.qty === 'number' ? doc.qty : null,
    type: (doc as any).type ?? 'MINIFIG',
    imageUrl: (doc as any).imageUrl ?? null,
  }

  return { props: { p: out } }
}

export default function MinifigPage({ p }: Props) {
  const title = `${p.name ?? p.itemNo ?? 'Minifigure'} — 1 Brick at a Time`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <section className="card detail" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
          <div className="imgWrap" style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e7e0d6' }}>
            {p.imageUrl ? (
              <Image
                src={p.imageUrl}
                alt={p.name ?? p.itemNo ?? 'Minifigure'}
                width={320}
                height={320}
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            ) : (
              <div style={{
                width: 320, height: 320, display: 'grid', placeItems: 'center',
                color: '#888', background: '#f6f0e6', borderRadius: 8
              }}>
                No image
              </div>
            )}
          </div>

          <div>
            <h1 style={{ margin: '0 0 8px' }}>{p.name ?? p.itemNo ?? 'Minifigure'}</h1>
            {p.itemNo && <div style={{ color: '#666', marginBottom: 12 }}>SKU: {p.itemNo}</div>}
            {typeof p.price === 'number' && (
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                AU${p.price.toFixed(2)}
              </div>
            )}
            <div style={{ color: p.qty && p.qty > 0 ? 'green' : '#a33' }}>
              {p.qty && p.qty > 0 ? `${p.qty} in stock` : 'Out of stock'}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}