// src/pages/cart.tsx
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
          </div>
        )}
      </main>

      <style jsx>{`
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
}