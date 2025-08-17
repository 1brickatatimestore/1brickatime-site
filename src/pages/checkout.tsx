import { useCart } from '../context/CartContext'
import { useMemo } from 'react'

const format = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart()
  const shippingCents = useMemo(() => (subtotalCents >= 7500 ? 0 : 899), [subtotalCents]) // $75+ free shipping example
  const taxCents = useMemo(() => Math.round(subtotalCents * 0.07), [subtotalCents])       // set your tax rate
  const totalCents = subtotalCents + shippingCents + taxCents

  return (
    <main className="container">
      <h1>Checkout</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="cartList">
            {items.map(i => (
              <li key={i.id} className="cartRow">
                <img src={i.imageUrl ?? '/logo.png'} alt="" />
                <div className="meta">
                  <div className="name">{i.name}</div>
                  {i.itemNo && <div className="sku">{i.itemNo}</div>}
                </div>
                <div className="qty">× {i.quantity}</div>
                <div className="price">{format(((i.priceCents ?? 0) * i.quantity) / 100)}</div>
              </li>
            ))}
          </ul>

          <div className="totals">
            <div><span>Subtotal</span><span>{format(subtotalCents / 100)}</span></div>
            <div><span>Shipping</span><span>{shippingCents ? format(shippingCents / 100) : 'Free'}</span></div>
            <div><span>Tax</span><span>{format(taxCents / 100)}</span></div>
            <div className="grand"><span>Total</span><span>{format(totalCents / 100)}</span></div>
          </div>

          <form method="POST" action="/api/checkout/checkout">
            <input type="hidden" name="amountCents" value={totalCents} />
            <button className="btnPrimary">Pay now</button>
          </form>

          <button className="btnGhost" onClick={clear}>Clear cart</button>
        </>
      )}
      <style jsx>{`
        .container{ max-width:900px; margin:40px auto; padding:0 16px; }
        .cartList{ list-style:none; padding:0; margin:0 0 24px; }
        .cartRow{ display:grid; grid-template-columns:64px 1fr auto auto; gap:12px; align-items:center; padding:12px; background:#fff; border-radius:12px; margin-bottom:8px; }
        .cartRow img{ width:64px; height:64px; object-fit:contain; }
        .meta .name{ font-weight:700; }
        .sku{ color:#6b7280; font-size:12px; }
        .qty, .price{ font-weight:700; }
        .totals{ background:#fff; border-radius:12px; padding:16px; margin:16px 0; }
        .totals > div{ display:flex; justify-content:space-between; padding:6px 0; }
        .grand{ font-size:18px; font-weight:800; border-top:1px dashed #ddd; margin-top:8px; padding-top:8px; }
        .btnPrimary{ background:#e1b946; border:2px solid #a2801a; padding:10px 16px; border-radius:8px; font-weight:700; color:#1a1a1a; }
        .btnGhost{ background:transparent; border:2px solid #204d69; padding:10px 16px; border-radius:8px; color:#204d69; font-weight:600; margin-left:8px; }
      `}</style>
    </main>
  )
}