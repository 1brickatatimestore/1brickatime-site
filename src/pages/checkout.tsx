import Head from 'next/head'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

type CartItem = {
  id: string
  name: string
  qty: number
  price: number
  imageUrl?: string | null
}

type Postage = { id: string; label: string; price: number }

const POSTAGE_OPTIONS: Postage[] = [
  { id: 'pickup', label: 'Local Pickup (free)', price: 0 },
  { id: 'letter', label: 'AU Letter Untracked', price: 3.5 },
  { id: 'parcel', label: 'AU Parcel Tracked', price: 9.9 },
]

function fmt(n: unknown) {
  const v = typeof n === 'number' && isFinite(n) ? n : 0
  return v.toFixed(2)
}

export default function CheckoutPage() {
  const cart = useCart()

  // Be tolerant of different CartContext shapes
  const items: CartItem[] = Array.isArray((cart as any)?.items) ? (cart as any).items : []
  const clear = (cart as any)?.clear || (() => {})
  const remove = (cart as any)?.remove || (cart as any)?.removeItem || (() => {})
  const setQty = (cart as any)?.setQty || (cart as any)?.updateQty || (() => {})

  const [postageId, setPostageId] = useState<string>(POSTAGE_OPTIONS[0].id)
  const [payMethod, setPayMethod] = useState<'card' | 'paypal' | 'bank'>('card')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const postage = useMemo<Postage>(() => {
    const found = POSTAGE_OPTIONS.find(p => p.id === postageId)
    return found || POSTAGE_OPTIONS[0]
  }, [postageId])

  const subtotal = useMemo(() => {
    try {
      return items.reduce((sum, it) => {
        const q = Number(it?.qty ?? 0)
        const p = Number(it?.price ?? 0)
        const line = isFinite(q) && isFinite(p) ? q * p : 0
        return sum + line
      }, 0)
    } catch {
      return 0
    }
  }, [items])

  const shipping = Number(postage?.price ?? 0)
  const total = subtotal + shipping

  async function payWithStripe() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/checkout/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
            price: i.price,
            imageUrl: i.imageUrl ?? undefined,
          })),
          postage: { id: postage.id, label: postage.label, price: postage.price },
        }),
      })
      if (!res.ok) throw new Error(`Stripe session failed (${res.status})`)
      const data = await res.json()
      if (!data?.url) throw new Error('Stripe session missing URL')
      window.location.href = data.url
    } catch (e: any) {
      setErr(e?.message || String(e))
      setBusy(false)
    }
  }

  async function payWithPayPal() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/checkout/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
            price: i.price,
          })),
          postage: { id: postage.id, label: postage.label, price: postage.price },
        }),
      })
      if (!res.ok) throw new Error(`PayPal order failed (${res.status})`)
      const data = await res.json()
      if (!data?.approveUrl) throw new Error('PayPal response missing approveUrl')
      window.location.href = data.approveUrl
    } catch (e: any) {
      setErr(e?.message || String(e))
      setBusy(false)
    }
  }

  function bankDeposit() {
    // Just show instructions; real “place order” flow can be added later.
    alert(
      'Bank Deposit Instructions:\n\n' +
      'Name: Kamila McIntyre\n' +
      'BSB: 032-513\n' +
      'Account: 450871\n\n' +
      'Please include your order number in the reference. Email proof of payment to 1brickatatimestore@gmail.com.'
    )
  }

  return (
    <>
      <Head>
        <title>{`Checkout — ${items.length} item${items.length === 1 ? '' : 's'}`}</title>
      </Head>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h1>Checkout</h1>

        {items.length === 0 ? (
          <>
            <p>Your cart is empty.</p>
            <Link href="/minifigs?type=MINIFIG&limit=36">Go shop minifigs</Link>
          </>
        ) : (
          <>
            <section className="cart">
              {items.map(i => {
                const line = Number(i.qty ?? 0) * Number(i.price ?? 0)
                return (
                  <div className="row" key={i.id}>
                    <div className="info">
                      <div className="name">{i.name}</div>
                      <div className="small">x{i.qty} @ ${fmt(i.price)}</div>
                    </div>
                    <div className="qty">
                      <label>
                        Qty:
                        <input
                          type="number"
                          min={1}
                          value={i.qty}
                          onChange={e => setQty(i.id, Number(e.target.value))}
                        />
                      </label>
                      <button
                        onClick={() => remove(i.id)}
                        className="linkBtn"
                        aria-label={`Remove ${i.name}`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="lineTotal">${fmt(line)}</div>
                  </div>
                )
              })}
            </section>

            <section className="postage">
              <h2>Postage</h2>
              {POSTAGE_OPTIONS.map(p => (
                <label key={p.id} className="radio">
                  <input
                    type="radio"
                    name="postage"
                    value={p.id}
                    checked={postageId === p.id}
                    onChange={() => setPostageId(p.id)}
                  />
                  <span>{p.label}</span>
                  <strong>${fmt(p.price)}</strong>
                </label>
              ))}
            </section>

            <section className="summary">
              <div className="line">
                <span>Subtotal</span>
                <strong>${fmt(subtotal)}</strong>
              </div>
              <div className="line">
                <span>Shipping</span>
                <strong>${fmt(shipping)}</strong>
              </div>
              <div className="line total">
                <span>Total</span>
                <strong>${fmt(total)}</strong>
              </div>
            </section>

            <section className="pay">
              <h2>Pay</h2>
              <div className="methods">
                <label className={payMethod === 'card' ? 'on' : ''}>
                  <input
                    type="radio"
                    name="pay"
                    value="card"
                    checked={payMethod === 'card'}
                    onChange={() => setPayMethod('card')}
                  />
                  Card (Stripe)
                </label>
                <label className={payMethod === 'paypal' ? 'on' : ''}>
                  <input
                    type="radio"
                    name="pay"
                    value="paypal"
                    checked={payMethod === 'paypal'}
                    onChange={() => setPayMethod('paypal')}
                  />
                  PayPal
                </label>
                <label className={payMethod === 'bank' ? 'on' : ''}>
                  <input
                    type="radio"
                    name="pay"
                    value="bank"
                    checked={payMethod === 'bank'}
                    onChange={() => setPayMethod('bank')}
                  />
                  Bank Deposit
                </label>
              </div>

              <div className="actions">
                {payMethod === 'card' && (
                  <button disabled={busy} onClick={payWithStripe} className="primary">
                    {busy ? 'Creating Stripe session…' : 'Pay with Card'}
                  </button>
                )}
                {payMethod === 'paypal' && (
                  <button disabled={busy} onClick={payWithPayPal} className="primary">
                    {busy ? 'Creating PayPal order…' : 'Pay with PayPal'}
                  </button>
                )}
                {payMethod === 'bank' && (
                  <button onClick={bankDeposit} className="primary">Show Bank Details</button>
                )}
                <button onClick={clear} className="ghost">Clear cart</button>
              </div>

              {err && <p style={{ color: '#b5463b' }}>{err}</p>}
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        h1 { margin: 0 0 16px; }
        .cart .row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,.08);
        }
        .name { font-weight: 600; }
        .small { font-size: 12px; opacity: .8; }
        .qty { display: flex; align-items: center; gap: 8px; }
        .qty input { width: 64px; padding: 4px 6px; }
        .linkBtn { background: none; border: 0; color: #b5463b; cursor: pointer; }
        .lineTotal { font-weight: 700; min-width: 72px; text-align: right; }

        .postage { margin: 18px 0 8px; }
        .radio {
          display: grid;
          grid-template-columns: 20px 1fr auto;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
        }

        .summary { margin: 12px 0 18px; }
        .summary .line {
          display: grid;
          grid-template-columns: 1fr auto;
          padding: 6px 0;
        }
        .summary .total { border-top: 1px dashed rgba(0,0,0,.2); margin-top: 6px; padding-top: 10px; }

        .methods { display: flex; gap: 16px; margin-bottom: 10px; }
        .methods label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
        .methods label.on { font-weight: 600; }

        .actions { display: flex; gap: 10px; }
        .primary {
          background: #1f5376; color: white; border: 0; border-radius: 8px;
          padding: 10px 14px; cursor: pointer;
        }
        .ghost {
          background: transparent; border: 1px solid #1f5376; color: #1f5376;
          border-radius: 8px; padding: 10px 14px; cursor: pointer;
        }
      `}</style>
    </>
  )
}