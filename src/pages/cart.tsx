// src/pages/cart.tsx
<<<<<<< HEAD
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
=======
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import { useCart } from '@/components/CartContext'

const BANK_DETAILS = {
  name: 'Kamila McIntyre',
  bsb: '032-513',
  account: '450871',
}

export default function CartPage() {
  const { items, updateQty, remove, subtotal, clear } = useCart()
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<{ id: string; subtotal: number } | null>(null)
  const [contact, setContact] = useState({ name: '', email: '', notes: '' })

  const placeOrder = async () => {
    if (items.length === 0) return
    setPlacing(true)
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'BANK',
          items,
          contact,
        }),
      })
      const j = await r.json()
      if (j.ok) {
        setPlaced({ id: j.orderId, subtotal: j.subtotal })
        clear()
      } else {
        alert(j.error || 'Failed to place order')
      }
    } catch (e: any) {
      alert(e.message || 'Network error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      <Head><title>Cart</title></Head>
      <main className="wrap">
        <h1>Cart</h1>

        {items.length === 0 && !placed && <p>Your cart is empty.</p>}

        {!!items.length && (
          <div className="cart">
            {items.map(it => (
              <div className="row" key={it.inventoryId}>
                <div className="img">
                  {it.imageUrl ? (
                    <Image src={it.imageUrl} alt={it.name || ''} width={72} height={72} />
                  ) : <div className="noImg">No image</div>}
                </div>
                <div className="info">
                  <div className="name">{it.name || it.itemNo}</div>
                  <div className="meta">
                    <span>${it.price.toFixed(2)}</span>
                    <label>
                      Qty:
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={e => updateQty(it.inventoryId, Math.max(1, parseInt(e.target.value || '1', 10)))}
                      />
                    </label>
                  </div>
                </div>
                <button className="rm" onClick={() => remove(it.inventoryId)}>×</button>
              </div>
            ))}
            <div className="sum">
              <div>Subtotal</div>
              <div className="money">${subtotal.toFixed(2)}</div>
            </div>

            <div className="contact">
              <h3>Contact</h3>
              <label>Full name
                <input value={contact.name} onChange={e => setContact(v => ({ ...v, name: e.target.value }))} />
              </label>
              <label>Email
                <input value={contact.email} onChange={e => setContact(v => ({ ...v, email: e.target.value }))} />
              </label>
              <label>Notes (optional)
                <textarea rows={3} value={contact.notes} onChange={e => setContact(v => ({ ...v, notes: e.target.value }))} />
              </label>
            </div>

            <button className="place" disabled={placing} onClick={placeOrder}>
              {placing ? 'Placing…' : 'Place Order (Bank Deposit)'}
            </button>
          </div>
        )}

        {placed && (
          <div className="placed">
            <h2>Order Placed</h2>
            <p><strong>Order ID:</strong> {placed.id}</p>
            <p><strong>Amount:</strong> ${placed.subtotal.toFixed(2)}</p>
            <div className="bank">
              <h3>Bank Deposit Details</h3>
              <p><strong>Name:</strong> {BANK_DETAILS.name}</p>
              <p><strong>BSB:</strong> {BANK_DETAILS.bsb}</p>
              <p><strong>Account:</strong> {BANK_DETAILS.account}</p>
              <p>Please include your Order ID as the payment reference.</p>
            </div>
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
          </div>
        )}
      </main>

      <style jsx>{`
<<<<<<< HEAD
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
=======
        .wrap { max-width: 900px; margin:0 auto; padding:20px 24px 40px; }
        h1 { margin: 0 0 12px; }
        .cart { background:#fff; border:1px solid #e7e2d9; border-radius:12px; padding:12px; }
        .row { display:grid; grid-template-columns: 84px 1fr 32px; gap:12px; align-items:center; padding:8px 0; border-bottom:1px dashed #eee; }
        .row:last-child { border-bottom:none; }
        .img { width:72px; height:72px; display:grid; place-items:center; background:#faf8f4; border-radius:8px; overflow:hidden; }
        .noImg { color:#888; font-size:12px; }
        .name { font-weight:600; margin-bottom:6px; }
        .meta { display:flex; gap:16px; align-items:center; color:#333; }
        input[type="number"] { width:72px; padding:6px; border:1px solid #cfcfcf; border-radius:8px; }
        .rm { border:none; background:transparent; font-size:20px; line-height:1; cursor:pointer; }
        .sum { display:flex; justify-content:space-between; padding:12px 4px; font-size:16px; border-top:1px solid #eee; margin-top:6px; }
        .money { font-weight:800; }
        .contact { margin-top:16px; display:grid; gap:8px; }
        .contact input, .contact textarea { width:100%; padding:8px; border:1px solid #cfcfcf; border-radius:8px; }
        .place { margin-top:12px; padding:10px 14px; border:1px solid #204d69; color:#fff; background:#204d69; border-radius:8px; }
        .placed { background:#fff; border:1px solid #e7e2d9; border-radius:12px; padding:16px; }
        .bank { background:#f0f6fb; border:1px solid #cfe2f3; border-radius:8px; padding:12px; margin-top:10px; }
      `}</style>
    </>
  )
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
}