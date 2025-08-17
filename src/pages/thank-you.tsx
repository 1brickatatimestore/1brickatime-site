import Head from 'next/head'
import Link from 'next/link'

export default function ThankYou() {
  return (
    <>
      <Head><title>Thank you — 1 Brick at a Time</title></Head>
      <main className="wrap">
        <div className="card">
          <h1>Thank you!</h1>
          <p>Your order was received. We’ll email you a confirmation shortly.</p>
          <div className="actions">
            <Link className="btn" href="/minifigs-by-theme">Keep browsing</Link>
            <Link className="btnGhost" href="/">Go home</Link>
          </div>
        </div>
      </main>

      <style jsx>{`
        .wrap{ margin-left:64px; padding:40px; display:grid; place-items:center; }
        .card{ background:#fff; padding:24px; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,.08); max-width:680px; width:100%; text-align:center; }
        .actions{ display:flex; gap:12px; justify-content:center; margin-top:12px; }
        .btn{ background:#e1b946; border:2px solid #a2801a; padding:10px 16px; border-radius:10px; font-weight:800; color:#1a1a1a; }
        .btnGhost{ border:2px solid #204d69; color:#204d69; padding:10px 16px; border-radius:10px; font-weight:700; }
      `}</style>
    </>
  )
}