import Head from 'next/head'

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>{`Terms & Conditions — 1 Brick at a Time`}</title>
        <meta name="description" content="Terms & Conditions for 1 Brick at a Time." />
      </Head>

      <main className="wrapPage">
        <h1>Terms &amp; Conditions</h1>
        <p><em>Last updated: {new Date().toISOString().slice(0,10)}</em></p>

        <h2>Orders & Payments</h2>
        <p>Orders are confirmed upon successful payment. Prices are in AUD unless noted.</p>

        <h2>Shipping</h2>
        <p>We aim to ship promptly. Delivery times depend on the selected method.</p>

        <h2>Returns & Refunds</h2>
        <p>Contact us within 14 days of delivery for help with issues. Refunds are credited to the original payment method after inspection.</p>

        <h2>Contact</h2>
        <p>Email: 1brickatatimestore@gmail.com</p>
      </main>

      <style jsx>{`
        .wrapPage { max-width:900px; margin: 24px auto; padding: 0 20px 80px; }
        h1 { margin: 0 0 14px; }
        h2 { margin: 20px 0 8px; }
        p, li { color:#1e1e1e; }
      `}</style>
    </>
  )
}