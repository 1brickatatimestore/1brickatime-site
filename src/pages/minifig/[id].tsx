// src/pages/minifig/[id].tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'
import { decode } from 'html-entities'

type Item = {
  _id?: string
  inventoryId: number
  itemNo: string | null
  name: string | null
  price: number | null
  qty: number | null
  imageUrl: string | null
  description: string | null
  remarks: string | null
  condition: string | null
  createdAt?: string
  updatedAt?: string
}

type Props = { item: Item }

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const raw = ctx.params?.id
  const invId = Number(raw)
  if (!Number.isFinite(invId)) return { notFound: true }

  await dbConnect(process.env.MONGODB_URI!)

  // @ts-ignore lean() returns plain object
  const doc = await Product.findOne({ inventoryId: invId }).lean()
  if (!doc) return { notFound: true }

  const item: Item = {
    _id: doc._id?.toString?.() ?? null,
    inventoryId: doc.inventoryId ?? invId,
    itemNo: doc.itemNo ?? null,
    name: doc.name ?? null,
    price: doc.price ?? null,
    qty: doc.qty ?? null,
    imageUrl: doc.imageUrl ?? null,
    description: doc.description ?? null,
    remarks: doc.remarks ?? null,
    condition: doc.condition ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  }

  return { props: { item } }
}

export default function MinifigDetail({ item }: Props) {
  const title = decode(item.name || item.itemNo || 'Minifig')
  const shopLink = item.itemNo
    ? `https://store.bricklink.com/1brickatatime#/shop?searchTerm=${encodeURIComponent(item.itemNo)}`
    : 'https://store.bricklink.com/1brickatatime.#/shop'

  return (
    <>
      <Head>
        <title>{`${title} — Minifig`}</title>
        <meta name="description" content={`Minifig ${title}.`} />
        <link rel="canonical" href={`/minifig/${item.inventoryId}`} />
        <script
          type="application/ld+json"
          // simple JSON-LD for product
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: title,
              sku: item.itemNo || undefined,
              image: item.imageUrl || undefined,
              offers:
                typeof item.price === 'number'
                  ? {
                      '@type': 'Offer',
                      priceCurrency: 'USD',
                      price: item.price.toFixed(2),
                      availability:
                        typeof item.qty === 'number' && item.qty > 0
                          ? 'https://schema.org/InStock'
                          : 'https://schema.org/OutOfStock',
                    }
                  : undefined,
            }),
          }}
        />
      </Head>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: 20 }}>
        <Link href={`/minifigs?type=MINIFIG&limit=36`}>&laquo; Back to Minifigs</Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            gap: 24,
            alignItems: 'start',
            marginTop: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e7e7e7',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                position: 'relative',
                overflow: 'hidden',
                background: '#fafafa',
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Image
                src={item.imageUrl || '/file.svg'}
                alt={title}
                width={800}
                height={800}
                sizes="(max-width: 900px) 90vw, 360px"
                style={{ objectFit: 'contain' }} // show full minifig
                priority
              />
            </div>
          </div>

          <div>
            <h1 style={{ margin: '4px 0 10px', fontSize: 28 }}>{title}</h1>

            <div style={{ display: 'flex', gap: 12, marginBottom: 10, color: '#333' }}>
              {item.itemNo ? <span>SKU: {item.itemNo}</span> : null}
              {typeof item.qty === 'number' ? <span>Qty: {item.qty}</span> : null}
              {item.condition ? <span>Cond: {item.condition}</span> : null}
            </div>

            {typeof item.price === 'number' ? (
              <div style={{ fontSize: 22, fontWeight: 800, color: '#204d69', marginBottom: 14 }}>
                ${item.price.toFixed(2)}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <a
                href={shopLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#e1b946',
                  border: '2px solid #a2801a',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontWeight: 700,
                  color: '#1a1a1a',
                }}
              >
                Buy on Bricklink
              </a>
              <Link
                href="/minifigs?type=MINIFIG&limit=36"
                style={{
                  border: '2px solid #204d69',
                  padding: '10px 16px',
                  borderRadius: 8,
                  color: '#204d69',
                  fontWeight: 600,
                }}
              >
                See All Items
              </Link>
            </div>

            {item.description ? <p style={{ margin: '0 0 8px' }}>{item.description}</p> : null}
            {item.remarks ? <p style={{ margin: 0, color: '#444' }}>Remarks: {item.remarks}</p> : null}
          </div>
        </div>
      </main>
    </>
  )
}