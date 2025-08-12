// src/pages/checkout.tsx
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { getCart, setCart, clearCart, totalAUD, CartItem } from '@/lib/cart'

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const total = useMemo(() => totalAUD(items), [items])

  useEffect(() => {
    setItems(getCart())
  }, [])

  function loadSamples() {
    const demo: CartItem[] = [
      { sku: 'sh0554', name: 'Nick Fury (Young)', price: 4.0, quantity: 1, imageUrl: 'https://img.bricklink.com/ItemImage/MN/0/sh0554.png' },
      { sku: 'sw0187', name: 'Rebel Fleet Trooper', price: 5.5, quantity: 1, imageUrl: 'https://img.bricklink.com/ItemImage/MN/0/sw0187.png' },
    ]
    setCart(demo)
    setItems(demo)
  }

  async function payStripe() {
    try {
      setBusy('stripe')
      const r = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await r.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data?.error || 'Stripe error')
      }
    } finally {
      setBusy(null)
    }
  }

  async function payPayPal() {
    try {
      setBusy('paypal')
      const r = await fetch('/api/checkout/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await r.json()
      if (data?.approveUrl) {
        window.location.href = data.approveUrl
      } else {
        alert(data?.error || 'PayPal error')
      }
    } finally {
      setBusy(null)
    }
  }

  async function payBank() {
    try {
      setBusy('bank')
      const r = await fetch('/api/checkout/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await r.json()
      if (data?.orderId) {
        alert(
          `Order ${data.orderId}\n\nTotal: AUD ${data.total.toFixed(2)}\n\n` +
          `Bank: ${data.bank.name}\nBSB: ${data.bank.bsb}\nAccount: ${data.bank.account}\n\n` +
          `${data.bank.referenceHint}`
        )
        clearCart()
        setItems([])
      } else {
        alert(data?.error || 'Bank checkout error')
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Head><title>Checkout — 1 Brick at a Time</title></Head>

      <main style={{maxWidth: 900, margin: '24px auto', padding: 16}}>
        <h1 style={{marginTop:0}}>Checkout</h1>

        {items.length === 0 ? (
          <div style={{padding: 12, background: '#fff', borderRadius: 8}}>
            <p>Your cart is empty.</p>
            <button onClick={loadSamples} style={btnStyle}>Load sample items</button>
          </div>
        ) : (
          <>
            <div style={{display:'grid', gap:12}}>
              {items.map((it) => (
                <div key={it.sku} style={{display:'flex', gap:12, alignItems:'center', background:'#fff', padding:12, borderRadius:8}}>
                  {it.imageUrl ? (
                    //  PAYPAL_CLIENT_SECRET_REDACTED@next/next/no-img-element
                    <img src={it.imageUrl} alt="" width={64} height={64} style={{objectFit:'contain'}} />
                  ) : null}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700}}>{it.name}</div>
                    <div style={{fontSize:12, opacity:.7}}>SKU: {it.sku}</div>
                  </div>
                  <div style={{width:120, textAlign:'right'}}>
                    x{it.quantity} &nbsp;—&nbsp; ${it.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:'flex', justifyContent:'space-between', marginTop:16}}>
              <button onClick={() => { clearCart(); setItems([]) }} style={btnGhost}>Clear cart</button>
              <div style={{fontWeight:800, fontSize:18}}>Total: AUD ${total.toFixed(2)}</div>
            </div>

            <div style={{display:'flex', gap:12, marginTop:16, flexWrap:'wrap'}}>
              <button onClick={payStripe} disabled={busy!==null} style={btnPrimary}>
                {busy==='stripe' ? 'Redirecting…' : 'Pay with Stripe'}
              </button>
              <button onClick={payPayPal} disabled={busy!==null} style={btnSecondary}>
                {busy==='paypal' ? 'Redirecting…' : 'Pay with PayPal'}
              </button>
              <button onClick={payBank} disabled={busy!==null} style={btnGhost}>
                {busy==='bank' ? 'Preparing…' : 'Pay by Bank Deposit'}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  )
}

const btnPrimary: React.CSSProperties = {
  background:'#e1b946', border:'2px solid #a2801a', padding:'10px 16px',
  borderRadius:8, fontWeight:700, cursor:'pointer'
}
const btnSecondary: React.CSSProperties = {
  background:'#1f5376', color:'#fff', border:'2px solid #15374d',
  padding:'10px 16px', borderRadius:8, fontWeight:700, cursor:'pointer'
}
const btnGhost: React.CSSProperties = {
  background:'transparent', border:'2px solid #204d69', padding:'10px 16px',
  borderRadius:8, fontWeight:700, cursor:'pointer'
}