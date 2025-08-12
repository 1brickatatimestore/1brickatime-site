<<<<<<< HEAD
// src/pages/checkout.tsx
<<<<<<< HEAD
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;     // dollars
  qty: number;
  imageUrl?: string | null;
};

type CartState = {
  items: CartItem[];
};

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.items)) {
      // normalize
      const items: CartItem[] = parsed.items.map((i: any) => ({
        id: String(i.id ?? i._id ?? ""),
        name: String(i.name ?? ""),
        price: Number(i.price ?? i.priceCents / 100 ?? 0),
        qty: Number(i.qty ?? i.quantity ?? 1),
        imageUrl: i.imageUrl ?? i.mainImage ?? i.image ?? null,
      }));
      return { items };
    }
    // legacy shape: array directly
    if (Array.isArray(parsed)) {
      const items: CartItem[] = parsed.map((i: any) => ({
        id: String(i.id ?? i._id ?? ""),
        name: String(i.name ?? ""),
        price: Number(i.price ?? i.priceCents / 100 ?? 0),
        qty: Number(i.qty ?? i.quantity ?? 1),
        imageUrl: i.imageUrl ?? i.mainImage ?? i.image ?? null,
      }));
      return { items };
    }
  } catch {
    /* ignore */
  }
  return { items: [] };
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartState>({ items: [] });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  const subtotal = useMemo(
    () => cart.items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [cart.items]
  );

  async function placeOrderBank() {
    setSubmitting(true);
    setMessage(null);
    try {
      // This hits your existing “bank deposit” endpoint if you later wire it up.
      const res = await fetch("/api/checkout/bank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          notes,
          items: cart.items,
          subtotal,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      // Optional: clear cart after success
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
      }
      setMessage(data?.message ?? "Order placed. Thanks! Check your email.");
    } catch (err: any) {
      setMessage(`Could not place order: ${err?.message ?? "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Checkout — 1 Brick at a Time</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="wrap">
        <h1>Checkout</h1>

        {cart.items.length === 0 ? (
          <div className="card empty">
            <p>Your cart is empty.</p>
            <Link className="btn" href="/minifigs">
              Browse Minifigs
            </Link>
          </div>
        ) : (
          <div className="grid">
            <section className="card">
              <h2>Items</h2>
              <ul className="items">
                {cart.items.map((it) => (
                  <li key={`${it.id}-${it.name}`} className="item">
                    {it.imageUrl ? (
                      // fall back to plain <img> so we don’t depend on next/image config here
                      <img src={it.imageUrl} alt="" className="thumb" />
                    ) : (
                      <div className="thumb placeholder">No image</div>
                    )}
                    <div className="meta">
                      <div className="name">{it.name}</div>
                      <div className="muted">
                        Qty {it.qty} · ${(it.price * it.qty).toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="subtotal">
                <span>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
            </section>

            <section className="card">
              <h2>Contact</h2>
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="field">
                <span>Notes (optional)</span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                />
              </label>

              <div className="actions">
                <button
                  className="btn primary"
                  onClick={placeOrderBank}
                  disabled={submitting || cart.items.length === 0}
                >
                  {submitting ? "Placing…" : "Place Order (Bank Deposit)"}
                </button>
                <Link className="btn ghost" href="/cart">
                  Back to Cart
                </Link>
              </div>

              {message && <p className="msg">{message}</p>}
            </section>
          </div>
        )}
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          margin: 0 0 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .card h2 {
          margin: 0 0 12px;
          font-size: 18px;
        }
        .empty {
          text-align: center;
        }
        .items {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .item {
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 12px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .item:last-child {
          border-bottom: 0;
        }
        .thumb {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 8px;
          background: #f6f6f6;
        }
        .thumb.placeholder {
          display: grid;
          place-items: center;
          color: #999;
          font-size: 12px;
        }
        .meta .name {
          font-weight: 600;
          margin-bottom: 2px;
        }
        .muted {
          color: #666;
          font-size: 12px;
        }
        .subtotal {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          margin-top: 8px;
          border-top: 1px solid #eee;
          font-size: 16px;
        }
        .field {
          display: grid;
          gap: 6px;
          margin: 12px 0;
        }
        .field span {
          font-size: 13px;
          color: #444;
        }
        input,
        textarea {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px 12px;
          font: inherit;
          width: 100%;
          background: #fff;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          align-items: center;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid #c9c9c9;
          background: #fafafa;
          text-decoration: none;
        }
        .btn.ghost {
          background: transparent;
        }
        .btn.primary {
          border-color: #caa21a;
          background: #f0c642;
          font-weight: 600;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .msg {
          margin-top: 12px;
          font-size: 14px;
        }
      `}</style>
=======
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
=======
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useMemo, useState } from 'react'
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)

const BANK_NAME = 'Bank Deposit'
const BANK_DETAILS = [
  'Account name: Kamila McIntyre',
  'BSB: 032-513',
  'Account number: 450871'
].join('\n')

export default function CheckoutPage() {
  const { items, updateQty, removeItem, clearCart, subtotal } = useCart()
  const [method, setMethod] = useState<'bank'|'paypal'|'stripe'>('bank')

  const orderRef = useMemo(() => {
    const t = new Date()
    return '1BAT-' + [
      t.getFullYear(),
      String(t.getMonth()+1).padStart(2,'0'),
      String(t.getDate()).padStart(2,'0'),
      String(t.getHours()).padStart(2,'0'),
      String(t.getMinutes()).padStart(2,'0'),
    ].join('')
  }, [])

  return (
    <>
      <Head><title>Checkout — 1 Brick at a Time</title></Head>

      <h1 style={{ margin:'0 0 16px' }}>Checkout</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. <Link href="/minifigs?type=MINIFIG&limit=36">Continue shopping</Link></p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>
          {/* Cart items */}
          <div>
            {items.map(i => (
              <div key={i.id} style={{
                display:'grid', gridTemplateColumns:'88px 1fr auto', gap:12, alignItems:'center',
                padding:'12px 0', borderBottom:'1px solid #e2e2e2'
              }}>
                <div style={{ position:'relative', width:88, height:88, background:'#fff', borderRadius:8, overflow:'hidden', display:'grid', placeItems:'center' }}>
                  {i.imageUrl ? (
                    <Image src={i.imageUrl} alt={i.name || i.itemNo || ''} fill sizes="88px" style={{ objectFit:'contain' }}/>
                  ) : <div style={{ color:'#999' }}>No image</div>}
                </div>
                <div>
                  <div style={{ fontWeight:700 }}>{i.name || i.itemNo}</div>
                  <div style={{ color:'#666', fontSize:13 }}>{i.itemNo}</div>
                  <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center' }}>
                    <label>
                      Qty{' '}
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={e => updateQty(i.id, Math.max(1, parseInt(e.target.value || '1', 10)))}
                        style={{ width:70, padding:'6px 8px', borderRadius:8, border:'1px solid #bbb' }}
                      />
                    </label>
                    <button onClick={() => removeItem(i.id)} style={{ marginLeft:8, color:'#b5463b' }}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight:800 }}>${((i.price ?? 0) * i.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside style={{
            border:'1px solid #ddd', borderRadius:12, padding:16, background:'#fff',
            boxShadow:'0 2px 10px rgba(0,0,0,.05)'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ color:'#666', fontSize:13, marginBottom:16 }}>
              Shipping is calculated after you confirm. Local pickup can be arranged on request.
            </div>

            <div style={{ margin:'12px 0 8px', fontWeight:700 }}>Payment</div>
            <label style={{ display:'block', marginBottom:6 }}>
              <input type="radio" name="pay" checked={method==='bank'} onChange={() => setMethod('bank')} /> Bank deposit
            </label>
            <label style={{ display:'block', marginBottom:6 }}>
              <input type="radio" name="pay" checked={method==='paypal'} onChange={() => setMethod('paypal')} /> PayPal (coming next)
            </label>
            <label style={{ display:'block', marginBottom:12 }}>
              <input type="radio" name="pay" checked={method==='stripe'} onChange={() => setMethod('stripe')} /> Card via Stripe (coming next)
            </label>

            {method === 'bank' && (
              <div style={{ background:'#f7f2e4', border:'1px dashed #bfa86a', borderRadius:8, padding:12, marginBottom:12 }}>
                <div style={{ fontWeight:800, marginBottom:6 }}>{BANK_NAME}</div>
                <div style={{ whiteSpace:'pre-wrap', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:13 }}>
                  {BANK_DETAILS}
                </div>
                <div style={{ marginTop:8, fontSize:13, color:'#333' }}>
                  Reference: <strong>{orderRef}</strong>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${BANK_DETAILS}\nReference: ${orderRef}`)}
                  style={{ marginTop:10, padding:'8px 10px', borderRadius:8, border:'1px solid #a2801a', background:'#e1b946', fontWeight:800, cursor:'pointer' }}
                >
                  Copy bank details
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (method === 'bank') {
                  alert(`Thanks! Please make a bank transfer with reference ${orderRef}. We’ll confirm via email.`)
                  clearCart()
                } else {
                  alert('PayPal/Stripe buttons will appear after we connect your keys.')
                }
              }}
              style={{
                width:'100%', padding:'12px 16px', borderRadius:10,
                background:'#1f5376', color:'#fff', fontWeight:800, border:'none', cursor:'pointer'
              }}
            >
              {method === 'bank' ? 'Place Manual Order' : 'Continue to Payment'}
            </button>

            <div style={{ textAlign:'center', marginTop:8 }}>
              <Link href="/minifigs?type=MINIFIG&limit=36">← Keep shopping</Link>
            </div>
          </aside>
        </div>
<<<<<<< HEAD
      </div>
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
=======
      )}
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
    </>
  )
}