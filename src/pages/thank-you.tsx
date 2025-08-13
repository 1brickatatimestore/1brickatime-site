import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

type CaptureOk = {
  ok: true
  orderId: string
  status?: string
  totals?: {
    items: number
    postage?: number
    shipping?: number
    grandTotal?: number
    currency?: string
  }
}

type CaptureErr = {
  ok: false
  error: string
  message?: string
}

type CaptureResponse = CaptureOk | CaptureErr

function getOrderIdFromQuery(query: Record<string, any>): string | null {
  // we support a few spellings just in case:
  //   ?orderId=... (preferred)
  //   ?orderid=...
  //   ?token=...   (paypal sometimes returns token)
  const raw =
    (query.orderId as string) ||
    (query.orderid as string) ||
    (query.token as string) ||
    ''
  return raw ? String(raw) : null
}

export default function ThankYouPage() {
  const router = useRouter()
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'capturing' | 'success' | 'already' | 'error'
  >('checking')
  const [msg, setMsg] = useState<string>('')
  const [totals, setTotals] = useState<CaptureOk['totals'] | undefined>()
  const [orderId, setOrderId] = useState<string | null>(null)
  const fired = useRef(false)

  // keep orderId stable as the router hydrates
  const stableOrderId = useMemo(() => {
    const oid = getOrderIdFromQuery(router.query as any)
    return oid
  }, [router.query])

  useEffect(() => {
    setOrderId(stableOrderId || null)
  }, [stableOrderId])

  useEffect(() => {
    // only attempt once we have an orderId
    if (!orderId) return

    // guard against hydration double-run and user refresh spam
    if (fired.current) return
    fired.current = true

    const doCapture = async () => {
      setStatus('capturing')
      setMsg('Finalizing your order…')

      try {
        const res = await fetch('/api/checkout/paypal-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })

        const json = (await res.json()) as CaptureResponse

        // normalize a few backend outcomes so the UI is stable:
        //  - ok:true => success
        //  - ok:false but error looks like "already_captured" / "imported" => treat as already
        //  - anything else => error
        if ('ok' in json && json.ok) {
          setTotals(json.totals)
          setStatus('success')
          setMsg('Payment captured and order saved. Thank you!')
          return
        }

        const lowErr = (json as CaptureErr).error?.toLowerCase() || ''
        if (
          lowErr.includes('already') ||
          lowErr.includes('imported') ||
          lowErr.includes('exists') ||
          lowErr.includes('duplicate')
        ) {
          setStatus('already')
          setMsg('Order already captured/imported. You’re all set!')
          return
        }

        setStatus('error')
        setMsg(
          (json as CaptureErr).message ||
            (json as CaptureErr).error ||
            'Something went wrong while finishing your order.'
        )
      } catch (e: any) {
        setStatus('error')
        setMsg(e?.message || 'Network error while contacting the server.')
      }
    }

    doCapture()
  }, [orderId])

  const retry = () => {
    fired.current = false
    setStatus('checking')
    setMsg('')
    // kick the effect again
    setTimeout(() => {
      if (orderId) {
        fired.current = false
        setStatus('idle')
        // force a state change to re-run effect
        setOrderId(orderId)
      }
    }, 0)
  }

  return (
    <>
      <Head>
        <title>Order status — 1 Brick at a Time</title>
        <meta
          name="description"
          content="Order confirmation and payment status for your purchase."
        />
      </Head>

      <main className="wrap" style={{ padding: '2rem 0' }}>
        <h1>Order status</h1>

        {!orderId && (
          <p>
            We couldn’t find an order id in the URL. You can head back to{' '}
            <Link href="/checkout">checkout</Link> or{' '}
            <Link href="/minifigs">browse minifigs</Link>.
          </p>
        )}

        {orderId && (
          <>
            {status === 'checking' || status === 'capturing' ? (
              <p>{msg || 'Checking your order…'}</p>
            ) : null}

            {status === 'success' && (
              <div className="card">
                <p style={{ marginBottom: '0.5rem' }}>{msg}</p>
                {!!totals && (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <li>
                      Items:{' '}
                      {totals.items.toLocaleString(undefined, {
                        style: 'currency',
                        currency: totals.currency || 'AUD',
                      })}
                    </li>
                    {typeof totals.postage === 'number' && (
                      <li>
                        Postage:{' '}
                        {totals.postage.toLocaleString(undefined, {
                          style: 'currency',
                          currency: totals.currency || 'AUD',
                        })}
                      </li>
                    )}
                    {typeof totals.shipping === 'number' && (
                      <li>
                        Shipping:{' '}
                        {totals.shipping.toLocaleString(undefined, {
                          style: 'currency',
                          currency: totals.currency || 'AUD',
                        })}
                      </li>
                    )}
                    {typeof totals.grandTotal === 'number' && (
                      <li>
                        Total:{' '}
                        {totals.grandTotal.toLocaleString(undefined, {
                          style: 'currency',
                          currency: totals.currency || 'AUD',
                        })}
                      </li>
                    )}
                  </ul>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: 12 }}>
                  <Link className="btn" href="/minifigs">
                    Browse minifigs
                  </Link>
                  <Link className="btn" href="/checkout">
                    Go to checkout
                  </Link>
                </div>
              </div>
            )}

            {status === 'already' && (
              <div className="card">
                <p>{msg}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: 12 }}>
                  <Link className="btn" href="/minifigs">
                    Browse minifigs
                  </Link>
                  <Link className="btn" href="/checkout">
                    Go to checkout
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="card">
                <p style={{ color: '#a00' }}>{msg}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: 12 }}>
                  <button className="btn" onClick={retry}>
                    Try again
                  </button>
                  <Link className="btn" href="/checkout">
                    Go to checkout
                  </Link>
                </div>
                <p style={{ marginTop: 8, opacity: 0.7, fontSize: 14 }}>
                  Order ID: <code>{orderId}</code>
                </p>
              </div>
            )}

            {(status === 'idle' || status === 'checking' || status === 'capturing') && (
              <div style={{ marginTop: 16 }}>
                <Link className="btn" href="/minifigs">
                  Browse minifigs
                </Link>{' '}
                <Link className="btn" href="/checkout">
                  Go to checkout
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .card {
          background: #fffdf8;
          border: 1px solid #e6dcc6;
          border-radius: 12px;
          padding: 16px 20px;
          max-width: 520px;
        }
        .btn {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 8px;
          background: #e2b14f;
          color: #111;
          text-decoration: none;
          border: 1px solid #b98d39;
        }
        .btn:hover {
          filter: brightness(0.97);
        }
      `}</style>
    </>
  )
}