import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCart } from '@/context/CartContext'

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const money = (n: number) => `AU$${(Number(n) || 0).toFixed(2)}`

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    // This is a placeholder. You already have Stripe/PayPal env set; we can
    // swap this for real capture later. For now, pretend success and clear.
    const fakeOrderId = `ORD-${Date.now()}`
    clear()
    router.push(`/thank-you?orderId=${encodeURIComponent(fakeOrderId)}`)
  }

  return (
    <>
      <Head><title>Checkout — 1 Brick at a Time</title></Head>
      <main className="wrap">
        <h1>Checkout</h1>

        <form className="grid" onSubmit={placeOrder}>
          <section className="card">
            <h2>Contact & Shipping</h2>
            <label>Full name<input required name="name" /></label>
            <label>Email<input required type="email" name="email" /></label>
            <label>Address<input required name="address" /></label>
            <label>City<input required name="city" /></label>
            <label>Postcode<input required name="zip" /></label>
            <label>Country<input required name="country" defaultValue="Australia" /></label>
          </section>

          <section className="card">
            <h2>Payment</h2>
            <label className="opt"><input type="radio" name="pay" value="stripe" defaultChecked /> Pay by Card (Stripe)</label>
            <label className="opt"><input type="radio" name="pay" value="paypal" /> PayPal</label>
            <label className="opt"><input type="radio" name="pay" value="bank" /> Bank Transfer</label>
          </section>

          <aside className="summary card">
            <h2>Order summary</h2>
            <ul>
              {items.map(i => (
                <li key={i.id}>
                  <span>{i.qty}× {i.name}</span>
                  <span>{money(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="sum"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <button className="btn" type="submit">Place order</button>
            <p className="tiny">You’ll see a confirmation page next.</p>
          </aside>
        </form>
      </main>

      <style jsx>{`
        .wrap{ margin-left:64px; padding:20px; }
        .grid{ display:grid; grid-template-columns:1fr 1fr 340px; gap:16px; }
        .card{ background:#fff; padding:14px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
        label{ display:flex; flex-direction:column; gap:6px; margin:8px 0; }
        input{ padding:10px; border:1px solid #cfc8be; border-radius:8px; }
        .opt{ display:flex; align-items:center; gap:10px; }
        .summary ul{ list-style:none; padding:0; margin:0 0 10px; display:flex; flex-direction:column; gap:6px; }
        .summary li{ display:flex; justify-content:space-between; }
        .sum{ display:flex; justify-content:space-between; font-size:18px; margin:10px 0; }
        .btn{ width:100%; padding:12px; border-radius:10px; background:#e1b946; border:2px solid #a2801a; font-weight:800; color:#1a1a1a; }
        .tiny{ color:#666; font-size:12px; text-align:center; }
        @media (max-width:1024px){ .grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  )
}