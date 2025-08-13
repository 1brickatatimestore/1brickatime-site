import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useCart } from '@/context/CartContext'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
  condition?: string
}

type Postage = { id: string; label: string; price: number }

const POSTAGE_OPTIONS: Postage[] = [
  { id: 'au-parcel',  label: 'AU Parcel Tracked', price: 9.9 },
  { id: 'au-express', label: 'AU Express',        price: 14.9 },
  { id: 'pickup',     label: 'Local Pickup',      price: 0 },
]

export default function CheckoutPage() {
  const { items, add, remove, clear } = useCart() as any

  const [payment, setPayment] = useState<'paypal' | 'card'>('paypal')
  const [postageId, setPostageId] = useState<string>(POSTAGE_OPTIONS[0].id)
  const postage = POSTAGE_OPTIONS.find(p => p.id === postageId) as Postage

  const subtotal = useMemo(
    () => (Array.isArray(items) ? items.reduce((sum: number, it: CartItem) => sum + (Number(it.price || 0) * Number(it.qty || 0)), 0) : 0),
    [items]
  )
  const total = useMemo(() => subtotal + (postage?.price ?? 0), [subtotal, postage])

  const disabled = !Array.isArray(items) || items.length === 0

  async function payWithStripe() {
    if (disabled) return
    const res = await fetch('/api/checkout/stripe-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        postage: { id: postage.id, label: postage.label, price: postage.price },
      }),
    })
    const data = await res.json()
    if (data?.url) {
      window.location.href = data.url
    } else {
      alert('Stripe failed to create a session.')
    }
  }

  async function payWithPayPal() {
    if (disabled) return
    const res = await fetch('/api/checkout/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        postage: { id: postage.id, label: postage.label, price: postage.price },
      }),
    })
    const data = await res.json()
    if (data?.approve) {
      window.location.href = data.approve
    } else {
      alert('PayPal response missing approveUrl')
    }
  }

  return (
    <>
      <Head>
        <title>{`Checkout — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <h1>Checkout</h1>

        {disabled ? (
          <p className="empty">
            Your cart is empty. <Link href="/minifigs">Browse minifigs →</Link>
          </p>
        ) : (
          <div className="layout">
            {/* LEFT: items */}
            <section className="cart">
              {items.map((i: CartItem) => (
                <div className="row" key={i.id}>
                  <div className="img">
                    {i.imageUrl ? (
                      <Image
                        src={i.imageUrl}
                        alt={i.name}
                        fill
                        sizes="96px"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="noImg">No image</div>
                    )}
                  </div>

                  <div className="info">
                    <div className="title">{i.name}</div>
                    <div className="meta">
                      {i.condition ? <span className="pill">{i.condition}</span> : null}
                      <span className="pill">Qty {i.qty}</span>
                    </div>
                  </div>

                  <div className="price">${Number(i.price).toFixed(2)}</div>

                  <button
                    className="remove"
                    onClick={() => remove ? remove(i.id) : null}
                    aria-label={`Remove ${i.name}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button className="clearBtn" onClick={() => clear && clear()}>
                Clear cart
              </button>
            </section>

            {/* RIGHT: summary */}
            <aside className="summary" aria-label="Order summary">
              <div className="line">
                <span>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>

              <div className="ship">
                <div className="label">Postage</div>
                <div className="opts">
                  {POSTAGE_OPTIONS.map((p) => (
                    <label key={p.id} className="opt">
                      <input
                        type="radio"
                        name="postage"
                        value={p.id}
                        checked={postageId === p.id}
                        onChange={() => setPostageId(p.id)}
                      />
                      <span>{p.label}</span>
                      <em>${p.price.toFixed(2)}</em>
                    </label>
                  ))}
                </div>
              </div>

              <div className="payPick">
                <label className="opt">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={payment === 'paypal'}
                    onChange={() => setPayment('paypal')}
                  />
                  <span>PayPal</span>
                </label>
                <label className="opt">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={payment === 'card'}
                    onChange={() => setPayment('card')}
                  />
                  <span>Card (Stripe)</span>
                </label>
              </div>

              <div className="line total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              <button
                className="payBtn"
                disabled={disabled}
                onClick={payment === 'card' ? payWithStripe : payWithPayPal}
              >
                Continue to payment
              </button>

              <p className="fine">
                You’ll be redirected to {payment === 'card' ? 'Stripe' : 'PayPal'} to complete your purchase.
              </p>
            </aside>
          </div>
        )}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1100px; }
        h1 { margin:4px 0 14px; font-size:24px; }
        .empty { background:#fff; padding:16px; border-radius:12px; border:1px solid #ddd; }
        .layout { display:grid; grid-template-columns: 1fr 340px; gap:18px; align-items:start; }
        .cart { background:#fff; border:1px solid #ddd; border-radius:12px; padding:10px; }
        .row { display:grid; grid-template-columns: 96px 1fr auto 32px; gap:12px; align-items:center; padding:8px; border-bottom:1px dashed #e7e2d9; }
        .row:last-child { border-bottom:0; }
        .img { position:relative; width:96px; height:96px; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { width:96px; height:96px; display:grid; place-items:center; color:#666; font-size:12px; background:#f7f5f2; border-radius:10px; }
        .info .title { font-weight:700; }
        .meta { display:flex; gap:6px; margin-top:4px; flex-wrap:wrap; }
        .pill { background:#eef3f6; color:#204d69; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid #d2dbe0; }
        .price { font-weight:800; color:#1f1f1f; }
        .remove { width:28px; height:28px; border-radius:8px; border:1px solid #d9d4cb; background:#fff; }
        .clearBtn { margin:8px; border:2px dashed #c1b9ae; border-radius:8px; background:#fff; padding:8px 10px; font-weight:700; }

        .summary { position:sticky; top:16px; background:#fff; border:1px solid #ddd; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:12px; }
        .line { display:flex; align-items:center; justify-content:space-between; }
        .total { border-top:1px solid #eee; padding-top:8px; font-size:18px; }
        .ship .label { font-weight:700; margin-bottom:6px; }
        .opts { display:flex; flex-direction:column; gap:6px; }
        .opt { display:flex; gap:8px; align-items:center; justify-content:space-between; border:1px solid #e6e1d8; border-radius:10px; padding:8px 10px; }
        .payPick { display:flex; gap:10px; }
        .payBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 14px; border-radius:10px; font-weight:800; }
        .fine { color:#444; font-size:12px; margin:0; }
        @media (max-width:980px){ .layout{ grid-template-columns: 1fr; } .summary{ position:static; } }
      `}</style>
    </>
  )
}