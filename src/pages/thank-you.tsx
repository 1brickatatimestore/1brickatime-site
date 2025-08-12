import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

const BANK = {
  name: process. PAYPAL_CLIENT_SECRET_REDACTED|| process. PAYPAL_CLIENT_SECRET_REDACTED|| '',
  bsb: process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BANK_DEPOSIT_BSB || '',
  account: process. PAYPAL_CLIENT_SECRET_REDACTED|| process. PAYPAL_CLIENT_SECRET_REDACTED|| '',
  hint: process. PAYPAL_CLIENT_SECRET_REDACTED|| process. PAYPAL_CLIENT_SECRET_REDACTED|| '',
}

type CaptureState =
  | { kind: 'idle' }
  | { kind: 'capturing' }
  | { kind: 'ok'; data: any }
  | { kind: 'error'; message: string }

export default function ThankYouPage() {
  const { query, replace } = useRouter()
  const [cap, setCap] = useState<CaptureState>({ kind: 'idle' })

  const info = useMemo(() => {
    const provider = (query.provider as string) || 'unknown'
    const status   = (query.status as string)   || 'unknown'
    // PayPal returns ?token=<orderId>; some flows can use ?orderId=
    const orderId  = (query.orderId as string)  || (query.token as string) || (query.session_id as string) || ''
    const total    = (query.total as string)    || ''
    return { provider, status, orderId, total }
  }, [query])

  // Auto-capture for PayPal on success if we have a token/orderId
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (info.provider === 'paypal' && info.status === 'success' && info.orderId && cap.kind === 'idle') {
      const abort = new AbortController()
      ;(async () => {
        try {
          setCap({ kind: 'capturing' })
          const r = await fetch(`/api/checkout/paypal-capture?orderId=${encodeURIComponent(info.orderId)}`, {
            method: 'POST',
            signal: abort.signal,
            headers: { 'Content-Type': 'application/json' },
          })
          const text = await r.text()
          if (!r.ok) throw new Error(text || `Capture failed (${r.status})`)
          const data = JSON.parse(text)
          setCap({ kind: 'ok', data })

          // Optional: remove the token from the URL so refreshes don’t re-capture
          const { provider, status, total } = info
          const clean = new URL(window.location.href)
          clean.searchParams.delete('token')
          clean.searchParams.delete('orderId')
          replace(clean.pathname + clean.search, undefined, { shallow: true })
        } catch (err: any) {
          setCap({ kind: 'error', message: err?.message || String(err) })
        }
      })()
      return () => abort.abort()
    }
  //  PAYPAL_CLIENT_SECRET_REDACTEDreact-hooks/exhaustive-deps
  }, [info.provider, info.status, info.orderId])

  const title =
    info.status === 'success' ? `Thank you — 1 Brick at a Time`
    : info.status === 'cancelled' ? `Order cancelled — 1 Brick at a Time`
    : `Order status — 1 Brick at a Time`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main style={{maxWidth: 900, margin:'24px auto', padding:'0 24px'}}>
        {info.status === 'success' ? (
          <>
            <h1 style={{margin:'0 0 8px'}}>Thank you for your order!</h1>
            <p style={{margin:'0 0 16px', color:'#333'}}>
              We’ve received your order{info.orderId ? ` (ref: ${info.orderId})` : ''}.
              {info.total ? ` Total: ${info.total}` : ''} You’ll get an email shortly.
            </p>

            {info.provider === 'paypal' && (
              <CaptureBanner cap={cap} />
            )}

            {info.provider === 'bank' && (BANK.name || BANK.bsb || BANK.account) && (
              <section style={{
                border:'1px solid #c9c3b9', background:'#fff', padding:16, borderRadius:8, margin:'16px 0'
              }}>
                <h2 style={{margin:'0 0 8px', fontSize:18}}>Bank deposit details</h2>
                <div style={{lineHeight:1.8}}>
                  {BANK.name && <div><strong>Account name:</strong> {BANK.name}</div>}
                  {BANK.bsb && <div><strong>BSB:</strong> {BANK.bsb}</div>}
                  {BANK.account && <div><strong>Account number:</strong> {BANK.account}</div>}
                  {info.orderId && <div><strong>Reference:</strong> {info.orderId}</div>}
                  {BANK.hint && <div><em>{BANK.hint}</em></div>}
                </div>
              </section>
            )}

            <div style={{display:'flex', gap:12}}>
              <Link href="/minifigs?type=MINIFIG&limit=36"><button style={btn()}>Continue shopping</button></Link>
              <Link href="/checkout"><button style={btn('ghost')}>View cart/receipt</button></Link>
            </div>
          </>
        ) : info.status === 'cancelled' ? (
          <>
            <h1 style={{margin:'0 0 8px'}}>Checkout cancelled</h1>
            <p style={{margin:'0 0 16px', color:'#333'}}>No worries—your cart is still here if you want to try again.</p>
            <div style={{display:'flex', gap:12}}>
              <Link href="/checkout"><button style={btn()}>Return to checkout</button></Link>
              <Link href="/minifigs?type=MINIFIG&limit=36"><button style={btn('ghost')}>Keep browsing</button></Link>
            </div>
          </>
        ) : (
          <>
            <h1 style={{margin:'0 0 8px'}}>Order status</h1>
            <p style={{margin:'0 0 16px', color:'#333'}}>We’re not sure yet—try refreshing this page, or head back to checkout.</p>
            <div style={{display:'flex', gap:12}}>
              <Link href="/checkout"><button style={btn()}>Go to checkout</button></Link>
              <Link href="/minifigs?type=MINIFIG&limit=36"><button style={btn('ghost')}>Browse minifigs</button></Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}

function CaptureBanner({ cap }: { cap: CaptureState }) {
  if (cap.kind === 'idle') return null
  if (cap.kind === 'capturing') {
    return (
      <div style={banner('#fff3cd', '#856404')}>
        Capturing PayPal payment…
      </div>
    )
  }
  if (cap.kind === 'ok') {
    return (
      <div style={banner('#d4edda', '#155724')}>
        PayPal payment captured. Thank you!
      </div>
    )
  }
  return (
    <div style={banner('#f8d7da', '#721c24')}>
      PayPal capture failed. You can retry from your account, or contact us. ({cap.message})
    </div>
  )
}

function banner(bg: string, fg: string): React.CSSProperties {
  return {
    background: bg,
    color: fg,
    padding: '12px 14px',
    borderRadius: 8,
    margin: '12px 0',
    border: `1px solid rgba(0,0,0,.08)`,
  }
}

function btn(kind: 'solid'|'ghost' = 'solid'): React.CSSProperties {
  if (kind === 'ghost') {
    return {
      background: 'transparent',
      border: '2px solid #1f5376',
      color: '#1f5376',
      padding: '10px 16px',
      borderRadius: 8,
      fontWeight: 600,
      cursor: 'pointer',
    }
  }
  return {
    background: '#e1b946',
    border: '2px solid #a2801a',
    color: '#1a1a1a',
    padding: '10px 16px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
  }
}