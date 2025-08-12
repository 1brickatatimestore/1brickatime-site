// src/pages/checkout.tsx
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';

type CartItem = { itemNo?: string; name: string; price: number; qty: number };

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualAmount, setManualAmount] = useState<string>('');

  useEffect(() => { setCart(readCart()); }, []);

  const total = useMemo(() => {
    const sum = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    if (!cart.length && manualAmount) return Number(manualAmount) || 0;
    return sum;
  }, [cart, manualAmount]);

  async function payStripe() {
    const items = cart.length
      ? cart
      : [{ name: 'Custom Order', price: Number(manualAmount || 0), qty: 1 }];
    const res = await fetch('/api/checkout/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        success_url: `${location.origin}/checkout?status=success`,
        cancel_url: `${location.origin}/checkout?status=cancel`,
      }),
    });
    const data = await res.json();
    if (data.url) location.href = data.url;
    else alert(data.error || 'Could not start Stripe checkout.');
  }

  async function placeBankOrder(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const customer = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      notes: fd.get('notes') as string,
    };
    const items = cart.length
      ? cart
      : [{ name: 'Custom Order', price: Number(manualAmount || 0), qty: 1 }];

    const res = await fetch('/api/orders/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items }),
    });
    const data = await res.json();
    if (data.ok) {
      alert('Bank order created. Please make the transfer using the details shown.');
      localStorage.removeItem('cart');
      setCart([]);
    } else {
      alert(data.error || 'Could not create bank order.');
    }
  }

  // PayPal Buttons loader
  useEffect(() => {
    const CID = process. PAYPAL_CLIENT_SECRET_REDACTED|| '';
    if (!CID) return;
    const id = 'paypal-sdk';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://www.paypal.com/sdk/js?client-id=${CID}&currency=AUD`;
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      if (window.paypal) {
        // @ts-ignore
        window.paypal.Buttons({
          createOrder: async () => {
            const amount = cart.length
              ? cart.reduce((s: number, i: CartItem) => s + i.price * (i.qty || 1), 0)
              : Number(manualAmount || 0);
            const r = await fetch('/api/checkout/paypal-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount }),
            });
            const d = await r.json();
            return d.id;
          },
          onApprove: async (data: any) => {
            const r = await fetch('/api/checkout/paypal-capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const d = await r.json();
            if (d.ok) {
              alert('Payment completed via PayPal. Thank you!');
              localStorage.removeItem('cart');
              setCart([]);
            } else {
              alert('PayPal capture failed.');
            }
          },
        }).render('#paypal-buttons');
      }
    };
    document.body.appendChild(s);
  }, [cart, manualAmount]);

  return (
    <>
      <Head><title>Checkout</title></Head>
      <div style={{ marginLeft: '64px', padding: '24px' }}>
        <h1 style={{ marginBottom: 8 }}>Checkout</h1>
        <p style={{ color: '#666', marginTop: 0 }}>
          Choose one of the payment methods below.
        </p>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 1100 }}>
          {/* Bank Deposit */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h3 style={{ marginTop: 0 }}>Bank Deposit</h3>
            <p style={{ fontSize: 14, lineHeight: 1.4 }}>
              Transfer the total to:<br />
              <b>Kamila McIntyre</b><br />
              <b>BSB:</b> 032-513<br />
              <b>Acc. Number:</b> 450871
            </p>
            <form onSubmit={placeBankOrder}>
              <div style={{ display: 'grid', gap: 8 }}>
                <input name="name" placeholder="Your name" required />
                <input name="email" placeholder="Email (for receipt)" required />
                <textarea name="notes" placeholder="Order notes (optional)" rows={3} />
                {!cart.length && (
                  <input
                    placeholder="Amount (AUD)"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    required
                  />
                )}
                <button type="submit" style={{ padding: '10px 14px', borderRadius: 8, background: '#1f5376', color: '#fff', border: 0 }}>
                  Place Bank Order
                </button>
              </div>
            </form>
          </div>

          {/* PayPal */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h3 style={{ marginTop: 0 }}>PayPal</h3>
            {!cart.length && (
              <input
                placeholder="Amount (AUD)"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                style={{ marginBottom: 8 }}
              />
            )}
            <div id="paypal-buttons" />
          </div>

          {/* Stripe */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h3 style={{ marginTop: 0 }}>Card (Stripe)</h3>
            {!cart.length && (
              <input
                placeholder="Amount (AUD)"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                style={{ marginBottom: 8 }}
              />
            )}
            <button onClick={payStripe} style={{ padding: '10px 14px', borderRadius: 8, background: '#635bff', color: '#fff', border: 0 }}>
              Pay with card (Stripe)
            </button>
          </div>
        </section>

        <div style={{ marginTop: 24, fontSize: 14, color: '#444' }}>
          <b>Total (AUD):</b> ${total.toFixed(2)}
        </div>
      </div>
    </>
  );
}