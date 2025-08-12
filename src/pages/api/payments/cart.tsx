// src/pages/cart.tsx
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

type CartItem = {
  id: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  qty: number
  imageUrl?: string | null
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [method, setMethod] = useState<'bank'|'stripe'|'paypal'>('bank')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart_v1')
      const cart = raw ? JSON.parse(raw) : { items: [] }
      setItems(Array.isArray(cart.items) ? cart.items : [])
    } catch {}
  }, [])

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0),
    [items]
  )

  function remove(i: number) {
    const next = items.slice()
    next.splice(i, 1)
    setItems(next)
    localStorage.setItem('cart_v1', JSON.stringify({ items: next }))
  }

  async function checkout() {
    if (items.length === 0) return alert('Cart is empty')

    if (method === 'bank') {
      const r = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          items,
          email,
          name,
          notes,
          paymentMethod: 'bank_deposit',
        }),
      })
      const j = await r.json()
      if (!j.ok) return alert(j.error || 'Error')
      alert(
        `Order received!\n\nOrder ID: ${j.orderId}\nTotal: $${Number(j.subtotal).toFixed(2)}\n\n` +
        `Bank details will be emailed to ${email || 'your address'}.`
      )
      localStorage.removeItem('cart_v1')
      window.location.href = '/'
    } else if (method === 'stripe') {
      const r = await fetch('/api/payments/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ items }),
      })
      const j = await r.json()
      if (!j.ok) return alert(j.error || 'Stripe error')
      window.location.href = j.url
    } else {
      const r = await fetch('/api/payments/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ items }),
      })
      const j = await r.json()
      if (!j.ok) return alert(j.error || 'PayPal error')
      if (j.approveLink) window.location.href = j.approveLink
      else alert('PayPal order created, but approval link missing.')
    }
  }

  return (
    <>
      <Head><title>Cart</title></Head>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1>Cart</h1>

        {items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
              {items.map((it, i) => (
                <li key={it.id} style={{
                  display:'grid', gridTemplateColumns:'1fr auto', gap:10,
                  background:'#fff', border:'1px solid #e7e7e7', borderRadius:10, padding:10, marginBottom:10
                }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{it.name || it.itemNo || 'Minifig'}</div>
                    <div style={{ fontSize:13, color:'#555' }}>
                      {it.itemNo ? `SKU: ${it.itemNo}` : ''} {typeof it.price === 'number' ? `• $${it.price.toFixed(2)}` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div>Qty: {it.qty}</div>
                    <button onClick={() => remove(i)} style={{ border:'1px solid #c9c9c9', borderRadius:6, padding:'6px 8px' }}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ fontSize:18, fontWeight:800, margin:'10px 0' }}>Subtotal: ${subtotal.toFixed(2)}</div>

            <fieldset style={{ border:'1px solid #e7e7e7', borderRadius:10, padding:12 }}>
              <legend>Checkout</legend>
              <div style={{ display:'flex', gap:14, marginBottom:10 }}>
                <label><input type="radio" name="m" checked={method==='bank'} onChange={()=>setMethod('bank')} /> Bank deposit</label>
                <label><input type="radio" name="m" checked={method==='stripe'} onChange={()=>setMethod('stripe')} /> Stripe</label>
                <label><input type="radio" name="m" checked={method==='paypal'} onChange={()=>setMethod('paypal')} /> PayPal</label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} style={{ padding:10, borderRadius:8, border:'1px solid #c9c9c9' }} />
                <input placeholder="Email (for invoice/details)" value={email} onChange={e=>setEmail(e.target.value)} style={{ padding:10, borderRadius:8, border:'1px solid #c9c9c9' }} />
                <textarea placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} style={{ gridColumn:'1 / span 2', padding:10, borderRadius:8, border:'1px solid #c9c9c9', minHeight:80 }} />
              </div>

              {method === 'bank' && (
                <p style={{ marginTop:10, color:'#333' }}>
                  We’ll email bank details and hold items for 48 hours. Please include your order ID in the transfer reference.
                </p>
              )}
            </fieldset>

            <button
              onClick={checkout}
              style={{ marginTop:12, background:'#e1b946', border:'2px solid #a2801a', padding:'10px 16px', borderRadius:8, fontWeight:700 }}
            >
              Complete Checkout
            </button>
          </>
        )}
      </main>
    </>
  )
}