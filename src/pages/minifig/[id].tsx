<<<<<<< HEAD
// src/pages/minifig/[id].tsx
<<<<<<< HEAD
import Head from "next/head";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

type Item = {
  _id: string;
  id: string;
  itemNo: string;
  name: string;
  remarks?: string;
  inventoryId?: number;
  price: number;
  priceCents: number;
  imageUrl?: string | null;
  stock: number;
  theme?: string;
  collection?: string;
  series?: string;
  condition?: string;
};

export default function MinifigDetail({ p }: { p: Item }) {
  const { add, getQty } = useCart();
  const inCart = getQty(p.itemNo || p.id);
  const left = Math.max(0, (p.stock || 0) - inCart);
  const disabled = left <= 0;

  return (
    <>
      <Head><title>{p.name || p.itemNo} — 1 Brick at a Time</title></Head>

      <article className="wrap detail">
        <div className="imgCol">
          {p.imageUrl ? (
            <Image src={p.imageUrl} alt={p.name || p.itemNo} width={480} height={480} />
          ) : (
            <div className="noImg">No image</div>
          )}
        </div>

        <div className="infoCol">
          <h1>{p.name || p.itemNo}</h1>
          <dl className="meta">
            {p.itemNo && (<><dt>Item No</dt><dd>{p.itemNo}</dd></>)}
            {p.inventoryId != null && (<><dt>Inventory ID</dt><dd>{p.inventoryId}</dd></>)}
            {p.theme && (<><dt>Theme</dt><dd>{p.theme}</dd></>)}
            {p.collection && (<><dt>Collection</dt><dd>{p.collection}</dd></>)}
            {p.series && (<><dt>Series</dt><dd>{p.series}</dd></>)}
            {p.condition && (<><dt>Condition</dt><dd>{p.condition}</dd></>)}
          </dl>

          {p.remarks && <p className="remarks">{p.remarks}</p>}

          <div className="buyRow">
            <div className="price">${p.price.toFixed(2)}</div>
            <button
              className="addBtn"
              disabled={disabled}
              onClick={() => !disabled && add({
                id: p.itemNo || p.id,
                name: p.name || p.itemNo,
                price: p.price,
                qty: 1,
                imageUrl: p.imageUrl ?? null,
                stock: p.stock,
              })}
            >
              {disabled ? "Sold out" : "Add to cart"}
            </button>
          </div>
          {p.stock > 0 && <div className="stock">Only available: {left} left</div>}
        </div>
      </article>

      <style jsx>{`
        .detail { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }
        .imgCol { background:#f7f5f2; border-radius:12px; display:grid; place-items:center; min-height:360px; }
        .infoCol h1{ margin:0 0 10px; font-size:22px; }
        .meta { display:grid; grid-template-columns:auto 1fr; gap:6px 12px; }
        dt{ color:#555; } dd{ margin:0; }
        .remarks{ margin:14px 0; color:#333; }
        .buyRow{ display:flex; align-items:center; gap:14px; margin-top:12px; }
        .price{ font-size:20px; font-weight:800; }
        .addBtn{ background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; }
        .stock{ color:#555; margin-top:6px; }
        @media (max-width:900px){ .detail{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}

export async function getServerSideProps(ctx: any) {
  const { req, query, params } = ctx;
  const host = req?.headers?.host || "localhost:3000";
  const proto = (req?.headers?.["x-forwarded-proto"] as string) || "http";
  const id = String(query.id ?? params?.id ?? "");

  const resP = await fetch(`${proto}://${host}/api/products?id=${encodeURIComponent(id)}`);
  if (!resP.ok) return { notFound: true };

  const pRaw = await resP.json();
  const p: Item = {
    _id: String(pRaw._id || pRaw.id || ""),
    id: String(pRaw.id || pRaw._id || ""),
    itemNo: String(pRaw.itemNo || ""),
    name: String(pRaw.name || ""),
    remarks: pRaw.remarks || "",
    inventoryId: pRaw.inventoryId ?? null,
    price: Number(pRaw.price ?? 0),
    priceCents: Number(pRaw.priceCents ?? 0),
    imageUrl: pRaw.imageUrl || null,  // never undefined
    stock: Number(pRaw.stock ?? 0),
    theme: pRaw.theme || "",
    collection: pRaw.collection || "",
    series: pRaw.series || "",
    condition: pRaw.condition || "",
  };

  return { props: { p } };
=======
=======
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
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
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
}