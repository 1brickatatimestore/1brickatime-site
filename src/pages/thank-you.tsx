import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Props = {
  provider?: string | null
  orderId?: string | null
  status?: 'success' | 'pending' | 'failed' | null
  test?: boolean
  error?: string | null
}

export default function ThankYouPage({ provider, orderId, status, test, error }: Props) {
  const isSuccess = status === 'success'
  const isFailed = status === 'failed'
  const isPending = !isSuccess && !isFailed

  return (
    <>
      <Head>
        <title>{isSuccess ? 'Thank you — 1 Brick at a Time' : 'Order status — 1 Brick at a Time'}</title>
      </Head>

      <main className="wrap">
        <div className="panel">
          {isSuccess && (
            <>
              <h1>Thank you!</h1>
              <p>Your payment {provider ? `via ${provider}` : ''} completed.</p>
              {orderId && <p className="muted">Order ID: <code>{orderId}</code></p>}
              {test && <p className="testNote">Test mode: No funds were captured.</p>}
              <div className="actions">
                <Link className="btn" href="/minifigs">Browse more minifigs</Link>
                <Link className="btnGhost" href="/checkout">Go to checkout</Link>
              </div>
            </>
          )}

          {isPending && (
            <>
              <h1>Order status</h1>
              <p>We’re not sure yet—try refreshing this page, or head back to checkout.</p>
              {orderId && <p className="muted">Order ID: <code>{orderId}</code></p>}
              {test && <p className="testNote">Test mode is enabled.</p>}
              <div className="actions">
                <Link className="btn" href="/checkout">Go to checkout</Link>
                <Link className="btnGhost" href="/minifigs">Browse minifigs</Link>
              </div>
            </>
          )}

          {isFailed && (
            <>
              <h1>Payment failed</h1>
              <p>Please try again or choose a different payment method.</p>
              {error && <p className="error">Error: {error}</p>}
              {orderId && <p className="muted">Order ID: <code>{orderId}</code></p>}
              <div className="actions">
                <Link className="btn" href="/checkout">Back to checkout</Link>
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:24px 22px 120px; max-width:900px; }
        .panel { background:#fff; border-radius:14px; box-shadow:0 2px 10px rgba(0,0,0,.08); padding:22px; }
        h1 { margin:0 0 10px; }
        .muted { color:#666; }
        .testNote { margin-top:8px; padding:8px 10px; background:#fff7d6; border:1px solid #e7d27a; border-radius:8px; }
        .actions { display:flex; gap:10px; margin-top:16px; }
        .btn { background:#e1b946; border:2px solid #a2801a; padding:8px 14px; border-radius:8px; font-weight:800; color:#1a1a1a; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:700; }
        .error { color:#a32828; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:18px 16px 110px; } }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const provider = (query.provider as string) || null
  const orderId = (query.orderId as string) || (query.orderID as string) || null
  const test = (query.test as string) === '1'
  const statusParam = (query.status as string) || ''
  const error = (query.error as string) || null

  const status: Props['status'] =
    statusParam === 'success' ? 'success' :
    statusParam === 'failed' ? 'failed' :
    'pending'

  return { props: { provider, orderId, status, test, error } }
}