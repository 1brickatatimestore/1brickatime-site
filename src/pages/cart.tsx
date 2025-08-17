import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { items, inc, dec, remove, subtotal } = useCart()
  const has = items.length > 0
  const money = (n: number) => `AU$${(Number(n) || 0).toFixed(2)}`

  return (
    <>
      <Head><title>Cart — 1 Brick at a Time</title></Head>
      <main className="wrap">
        <h1>Cart</h1>

        {!has ? (
          <p>Your cart is empty. <Link href="/minifigs-by-theme">Browse minifigs</Link>.</p>
        ) : (
          <div className="grid">
            <section className="items">
              {items.map(it => (
                <article key={it.id} className="row">
                  <div className="thumb">
                    <Image src={it.imageUrl || '/no-image.png'} alt={it.name} fill style={{objectFit:'contain'}} />
                  </div>
                  <div className="name">{it.name}</div>
                  <div className="qty">
                    <button onClick={() => dec(it.id)}>-</button>
                    <span>{it.qty}</span>
                    <button onClick={() => inc(it.id)}>+</button>
                  </div>
                  <div className="price">{money(it.price)}</div>
                  <div className="line">{money(it.price * it.qty)}</div>
                  <button className="remove" onClick={() => remove(it.id)}>Remove</button>
                </article>
              ))}
            </section>

            <aside className="summary">
              <h2>Summary</h2>
              <div className="sum"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <Link className="btn" href="/checkout">Proceed to checkout</Link>
            </aside>
          </div>
        )}
      </main>

      <style jsx>{`
        .wrap{ margin-left:64px; padding:20px; }
        .grid{ display:grid; grid-template-columns:1fr 300px; gap:20px; }
        .items{ display:flex; flex-direction:column; gap:10px; }
        .row{ display:grid; grid-template-columns:100px 1fr 120px 120px 120px 100px; gap:10px; align-items:center; background:#fff; padding:10px; border-radius:10px; }
        .thumb{ position:relative; width:100px; height:100px; background:#f6f4f0; border-radius:10px; overflow:hidden; }
        .qty button{ width:28px; height:28px; }
        .summary{ background:#fff; padding:14px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.08); height:max-content; }
        .btn{ display:block; text-align:center; margin-top:12px; padding:10px; border-radius:8px; background:#e1b946; border:2px solid #a2801a; font-weight:800; color:#1a1a1a; }
        @media (max-width:900px){ .grid{ grid-template-columns:1fr; } .row{ grid-template-columns:80px 1fr 100px 90px 90px 80px; } }
      `}</style>
    </>
  )
}