import Head from 'next/head'
import Link from 'next/link'

export default function ServerErrorPage() {
  return (
    <>
      <Head>
        <title>{`Something went wrong — 1 Brick at a Time`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="wrap500">
        <div className="box">
          <h1>We hit a snag</h1>
          <p>Sorry — something broke on our side. Try again, or head back to the shop.</p>
          <Link className="btn" href="/minifigs">Back to Minifigs</Link>
        </div>
      </main>

      <style jsx>{`
        .wrap500 { min-height: calc(100vh - 160px); display:grid; place-items:center; padding:40px 20px; }
        .box { background:#fff; border-radius:16px; box-shadow:0 6px 24px rgba(0,0,0,.08); padding:28px; text-align:center; max-width:560px; width:100%; }
        h1 { margin:0 0 12px; font-size:34px; }
        p { margin:0 0 18px; color:#333; }
        .btn { display:inline-block; background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:10px 16px; border-radius:10px; font-weight:800; }
      `}</style>
    </>
  )
}