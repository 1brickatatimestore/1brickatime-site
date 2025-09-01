// src/pages/minifig/[id].tsx
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
          {p.stock > 0 && <div className="stock">In stock: {left} left</div>}
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
}