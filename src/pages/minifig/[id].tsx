import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'
import { useCart } from '@/context/CartContext'

type Doc = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  condition?: string
  price?: number
  qty?: number
  imageUrl?: string
  description?: string
}

type Props = { item: Doc }

function isObjectId(v: string) {
  return /^[0-9a-fA-F]{24}$/.test(v)
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
  const id = String(params?.id || '').trim()

  await dbConnect(process.env.MONGODB_URI!)

  let doc: any = null

  if (isObjectId(id)) {
    // /minifig/<mongoId>
    doc = await Product.findById(id).lean()
  } else if (!Number.isNaN(Number(id))) {
    // /minifig/<inventoryId number>
    doc = await Product.findOne({ inventoryId: Number(id) }).lean()
  } else {
    // /minifig/<itemNo>  e.g., sw0187
    doc = await Product.findOne({ itemNo: id }).lean()
  }

  if (!doc) return { notFound: true }

  // make the object JSON-safe
  doc._id = String(doc._id)

  return { props: { item: doc } }
}

export default function MinifigDetail({ item }: Props) {
  const { add } = useCart()

  const price = Number(item.price || 0)
  const idForCart = item.inventoryId ? String(item.inventoryId) : String(item._id)

  return (
    <>
      <Head>
        <title>{item.name || item.itemNo || 'Minifig'}</title>
      </Head>

      <main style={{ marginLeft: 'var(--rail-w, 64px)', padding: 24 }}>
        <Link href="/minifigs" style={{ color: '#1f5376' }}>← Back to Minifigs</Link>

        <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, marginTop: 16 }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f6f6f6', borderRadius: 12, overflow: 'hidden' }}>
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name || item.itemNo || 'Minifig'}
                fill
                sizes="320px"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#888' }}>No image</div>
            )}
          </div>

          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>{item.name || item.itemNo}</h1>
            <div style={{ color: '#333', marginBottom: 10 }}>
              {item.itemNo} · {(item.condition || 'U').toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>${price.toFixed(2)}</div>

            <button
              onClick={() =>
                add({
                  id: idForCart,
                  name: item.name ?? item.itemNo ?? 'Minifig',
                  price,
                  qty: 1,
                  imageUrl: item.imageUrl,
                })
              }
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '2px solid #a2801a',
                background: '#e1b946',
                color: '#1a1a1a',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Add to Cart
            </button>

            {item.description && (
              <p style={{ marginTop: 18, maxWidth: 720, lineHeight: 1.45 }}>{item.description}</p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}