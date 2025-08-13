import Head from 'next/head'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>{`Page not found — 1 Brick at a Time`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="wrap404">
        <div className="box">
          <h1>404</h1>
          <p>Whoops — that page took a wrong turn.</p>
          <Link className="btn" href="/">Go home</Link>
          <Link className="btnGhost" href="/minifigs">Browse Minifigs</Link>
        </div>
      </main>

      <style jsx>{`
        .wrap404 { min-height: calc(100vh - 160px); display:grid; place-items:center; padding:40px 20px; }
        .box { background:#fff; border-radius:16px; box-shadow:0 6px 24px rgba(0,0,0,.08); padding:28px; text-align:center; max-width:560px; width:100%; }
        h1 { margin:0 0 12px; font-size:48px; letter-spacing:1px; }
        p { margin:0 0 18px; color:#333; }
        .btn { display:inline-block; margin:0 8px 8px; background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 16px; border-radius:10px; font-weight:800; }
        .btnGhost { display:inline-block; margin:0 8px 8px; border:2px solid #204d69; color:#204d69; padding:10px 16px; border-radius:10px; font-weight:700; }
      `}</style>
    </>
  )
}