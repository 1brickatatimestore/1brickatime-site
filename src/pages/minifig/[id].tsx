import Head from 'next/head'
import Image from 'next/image'
import type { GetServerSideProps } from 'next'

type Product = {
  _id?: string
  inventoryId?: number                 // BrickLink lot id
  itemNo?: string                      // BrickLink minifig id (e.g. sw00452)
  name?: string
  price?: number
  qty?: number
  condition?: 'N' | 'U' | string
  imageUrl?: string | null
  // extra BL-ish fields (these are commonly present after sync)
  description?: string                 // BrickLink “Description”
  remarks?: string                     // BrickLink “My remarks”
  blItemId?: string | number           // sometimes present from API
}

function decodeHtml(s?: string | null) {
  if (!s) return ''
  // quick & safe for the few encodings BrickLink uses in names
  return s
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export default function MinifigPage({ p }: { p: Product }) {
  const name = decodeHtml(p?.name) || p?.itemNo || 'Minifigure'
  const img = p?.imageUrl || '/no-image.png' // never undefined
  const price = typeof p?.price === 'number' ? p!.price : 0

  return (
    <>
      <Head><title>{name} — 1 Brick at a Time</title></Head>

      <main className="wrap">
        <article className="card">
          <div className="imgBox">
            <Image
              src={img}
              alt={name}
              fill
              sizes="(max-width: 900px) 90vw, 520px"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              priority
            />
          </div>

          <div className="info">
            <h1 className="title">{name}</h1>
            <div className="sku">SKU: {p?.itemNo || '—'}</div>
            <div className="price">AU${price.toFixed(2)}</div>
            <div className="stock">{(p?.qty ?? 0) > 0 ? '1 in stock' : 'Out of stock'}</div>

            <dl className="meta">
              <div>
                <dt>Lot ID</dt>
                <dd>{p?.inventoryId ?? '—'}</dd>
              </div>
              <div>
                <dt>Minifig ID</dt>
                <dd>{p?.itemNo ?? '—'}</dd>
              </div>
              {p?.blItemId ? (
                <div>
                  <dt>BrickLink Item</dt>
                  <dd>{String(p.blItemId)}</dd>
                </div>
              ) : null}
            </dl>

            {(p?.description || p?.remarks) && (
              <section className="text">
                {p?.description ? (
                  <>
                    <h3>Description</h3>
                    <p>{decodeHtml(p.description)}</p>
                  </>
                ) : null}
                {p?.remarks ? (
                  <>
                    <h3>Seller remarks</h3>
                    <p>{decodeHtml(p.remarks)}</p>
                  </>
                ) : null}
              </section>
            )}
          </div>
        </article>
      </main>

      <style jsx>{`
        .wrap{ margin-left:64px; padding:20px; }
        .card{ display:grid; grid-template-columns:520px 1fr; gap:24px; background:#fff; padding:18px; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
        .imgBox{ position:relative; width:100%; aspect-ratio:1/1; background:#f6f4f0; border-radius:12px; overflow:hidden; }
        .info{ display:flex; flex-direction:column; gap:8px; }
        .title{ margin:0 0 4px; }
        .sku{ color:#666; font-size:12px; }
        .price{ font-weight:800; }
        .stock{ color:#1a7f37; font-weight:700; }
        .meta{ display:grid; grid-template-columns:repeat(3, minmax(120px, 1fr)); gap:12px; margin-top:6px; }
        .meta dt{ font-size:12px; color:#666; }
        .meta dd{ margin:2px 0 0; font-weight:600; }
        .text h3{ margin:14px 0 6px; }
        @media (max-width:900px){
          .card{ grid-template-columns:1fr; }
        }
      `}</style>
    </>
  )
}

/**
 * Accepts:
 *  - /minifig/<ObjectId>
 *  - /minifig/<inventoryId>     (number, BL lot id)
 *  - /minifig/<itemNo>          (e.g. sw0452, hp008, etc.)
 */
export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const id = String(params?.id || '')
  const host = req?.headers?.host || 'localhost:3000'
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'http'

  // Ask the products API for EXACTLY one item by the most forgiving key
  const url = new URL(`${proto}://${host}/api/products`)
  url.searchParams.set('limit', '1')
  // send all three keys; the API can decide which matches
  url.searchParams.set('id', id)                // ObjectId
  url.searchParams.set('inventoryId', id)       // numeric string ok
  url.searchParams.set('itemNo', id.toLowerCase())

  const r = await fetch(url.toString())
  if (!r.ok) return { notFound: true }

  const j = await r.json()
  const p: Product | undefined =
    Array.isArray(j.items) && j.items.length ? j.items[0] :
    Array.isArray(j.results) && j.results.length ? j.results[0] :
    undefined

  if (!p) return { notFound: true }

  // Never send undefined to Next; normalize
  if (!p.imageUrl) (p as any).imageUrl = null

  return { props: { p } }
}