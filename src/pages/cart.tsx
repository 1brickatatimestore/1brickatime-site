// src/pages/cart.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export default function CartPage() {
  const { items, updateQty, remove, clear, subtotal } = useCart();

  return (
    <>
      <Head><title>Cart — 1 Brick at a Time</title></Head>

      <main className="wrap">
        <h1>Cart</h1>

        {(!items || items.length === 0) ? (
          <>
            <p>Your cart is empty.</p>
            <p><Link href="/minifigs-by-theme" className="btn">Browse minifigs</Link></p>
          </>
        ) : (
          <div className="cartGrid">
            <div className="items">
              {items.map(it => (
                <div key={it.id} className="row">
                  {it.imageUrl ? (
                    <Image src={it.imageUrl} alt={it.name} width={64} height={64} />
                  ) : (
                    <div className="noImg" />
                  )}
                  <div className="col">
                    <div className="name">{it.name}</div>
                    <div className="muted">{money(it.price)}</div>
                  </div>
                  <div className="qty">
                    <input
                      type="number"
                      min={0}
                      max={it.stock ?? undefined}
                      value={it.qty}
                      onChange={(e) => updateQty(it.id, Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                  <div className="line">{money(it.price * it.qty)}</div>
                  <button className="link" onClick={() => remove(it.id)}>Remove</button>
                </div>
              ))}

              <div className="actions">
                <button className="btnGhost" onClick={() => clear()}>Clear cart</button>
                <Link href="/minifigs-by-theme" className="btnGhost">Keep shopping</Link>
              </div>
            </div>

            <aside className="summary">
              <h2>Summary</h2>
              <div className="sum"><div>Subtotal</div><div className="money">{money(subtotal)}</div></div>
              <Link href="/checkout" className="btnPrimary" aria-disabled={(subtotal || 0) <= 0}>Proceed to checkout</Link>
            </aside>
          </div>
        )}
      </main>

      <style jsx>{`
        .cartGrid{ display:grid; grid-template-columns: 1fr 320px; gap:24px; }
        .row{ display:grid; grid-template-columns: 64px 1fr 90px 90px auto; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #eee; }
        .col .name{ font-weight:700; }
        .muted{ color:#666; }
        .qty input{ width:72px; padding:6px; }
        .line{ text-align:right; font-weight:700; }
        .link{ background:none; color:#204d69; border:none; cursor:pointer; }
        .actions{ display:flex; gap:10px; margin-top:10px; }
        .summary{ background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.08); height: fit-content; }
        .sum{ display:flex; justify-content:space-between; margin:12px 0; font-weight:700; }
        .btnPrimary { background:#e1b946; border:2px solid #a2801a; padding:10px 14px; border-radius:8px; font-weight:800; display:inline-block; text-align:center; }
        .btnGhost{ border:2px solid #204d69; color:#204d69; padding:8px 12px; border-radius:8px; font-weight:700; }
        @media (max-width:900px){ .cartGrid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}