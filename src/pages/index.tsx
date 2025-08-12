import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Head>
        <title>1 Brick at a Time — Home</title>
      </Head>

      <main className="home">
        {/* HERO */}
        <section className="hero">
          <div className="logoWrap">
            <Image
              src="/logo.png"
              alt="1 Brick at a Time — logo"
              width={220}
              height={220}
              sizes="(max-width: 920px) 200px, 220px"
              priority
            />
          </div>

          <div className="copy">
            <h1>
              1 Brick at a <em>time.</em>
            </h1>

            <p className="sub">
              Owned by K &amp; K Enterprises — Director: Kamila McT. Building connections — human and LEGO ones — since 2023.
            </p>

            <div className="ctaRow">
              <Link href="/minifigs?type=MINIFIG&limit=36" className="btnPrimary">
                Shop Now
              </Link>
              <Link href="/minifigs?limit=36" className="btnGhost">
                See All Items
              </Link>
            </div>
          </div>
        </section>

        {/* HANDWRITTEN NOTE */}
        <section className="note">
          <h2 className="gday">G’day,</h2>
          <p className="hand">
            we strive for 100% customer satisfaction, so please let us know if there’s anything else we can do for you.
          </p>
        </section>
      </main>

      <style jsx>{`
        .home {
          max-width: 980px;
          margin: 0 auto;
          padding: 24px;
        }
        .hero {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: center;
          margin-top: 8px;
        }
        .logoWrap {
          width: 260px;
          height: 260px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        h1 {
          margin: 0 0 8px;
          font-size: 48px;
          line-height: 1.1;
          font-weight: 800;
          color: #2b2b2b;
        }
        h1 em {
          color: #b5463b;
          font-style: normal;
          font-family: 'Satisfy', cursive; /* handwriting accent */
        }
        .sub {
          margin: 0 0 14px;
          max-width: 640px;
          color: #2f2f2f;
          font-size: 15px;
        }
        .ctaRow { display: flex; gap: 12px; }
        .btnPrimary {
          background: #e1b946;
          border: 2px solid #a2801a;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .btnGhost {
          background: transparent;
          border: 2px solid #204d69;
          padding: 10px 16px;
          border-radius: 8px;
          color: #204d69;
          font-weight: 600;
        }

        .note { margin-top: 36px; }
        .gday {
          margin: 0 0 8px;
          font-size: 64px;
          line-height: 1;
          color: #b5463b;
          font-family: 'Satisfy', cursive;
          font-weight: 400;
        }
        .hand {
          margin: 0;
          max-width: 900px;
          font-size: 28px;
          line-height: 1.35;
          font-family: 'Satisfy', cursive;
          color: #1f1f1f;
        }

        @media (max-width: 920px) {
          .hero { grid-template-columns: 1fr; }
          .logoWrap { width: 200px; height: 200px; margin: 0 auto; }
          h1 { font-size: 40px; }
          .gday { font-size: 52px; }
          .hand { font-size: 24px; }
        }
      `}</style>
    </>
  )
}