// src/pages/minifig/[id].tsx
import Image from 'next/image'
import type { GetServerSideProps } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product, { ProductDoc } from '@/models/Product'

type Props = {
  product: null | {
    _id: string
    itemNo?: string
    name?: string
    price?: number
    qty?: number
    imageUrl?: string
  }
}

function isObjectIdLike(s: string) {
  return /^[0-9a-f]{24}$/i.test(s)
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id || '').trim()
  if (!id) return { notFound: true }

  await dbConnect(process.env.MONGODB_URI!)

  let doc: ProductDoc | null = null
  if (isObjectIdLike(id)) {
    doc = await Product.findById(id).lean()
  } else {
    doc = await Product.findOne({ itemNo: id }).lean()
  }

  if (!doc) return { notFound: true }

  return {
    props: {
      product: {
        _id: String(doc._id),
        itemNo: doc.itemNo,
        name: doc.name,
        price: doc.price,
        qty: doc.qty,
        imageUrl: doc.imageUrl || null,
      },
    },
  }
}

export default function MinifigDetail({ product }: Props) {
  if (!product) return null

  const { name, price, qty, itemNo, imageUrl } = product

  return (
    <main className="wrap">
      <article style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div className="card" style={{ height: 320, display: 'grid', placeItems: 'center' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name || itemNo || 'Minifig'}
              width={280}
              height={280}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div style={{ color: '#6b7280' }}>No image</div>
          )}
        </div>

        <div>
          <h1 style={{ margin: '0 0 8px' }}>{name || itemNo || 'Minifig'}</h1>
          <div style={{ color: '#6b7280', marginBottom: 8 }}>SKU: {itemNo || '—'}</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {typeof price === 'number' ? `$${price.toFixed(2)}` : '—'}
          </div>
          {typeof qty === 'number' && (
            <div style={{ color: qty > 0 ? '#197d3a' : '#6b7280' }}>
              {qty > 0 ? `${qty} in stock` : 'Out of stock'}
            </div>
          )}
        </div>
      </article>
    </main>
  )
}