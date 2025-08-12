import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useMemo, useState } from 'react'

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
      )}
    </>
  )
}