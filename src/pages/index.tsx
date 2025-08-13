// src/pages/index.tsx
import Link from 'next/link'
import Head from 'next/head'
import s from './index.module.css'

export default function Home() {
  return (
    <>
      <Head>
        <title>1 Brick at a Time</title>
        <meta name="description" content="Owned by K & K Enterprises — Director: Kamila McT. Building connections — human and LEGO ones — since 2023." />
      </Head>

      <main className={s.page}>
        {/* Hero row: logo card + title block */}
        <section className={s.hero}>
          <div className={s.logoCard}>
            {/* Use your existing file name; this will NOT rename anything */}
            <img
              src="/logo-1brickatime.png"
              alt="1 Brick at a Time"
              className={s.logo}
              loading="eager"
            />
          </div>

          <div className={s.titleBlock}>
            <h1 className={s.h1}>
              1 Brick at a <span className={s.timeAccent}>time.</span>
            </h1>

            <p className={s.tagline}>
              Owned by K &amp; K Enterprises — Director: Kamila McT. Building connections — human and LEGO
              ones — since 2023.
            </p>

            <div className={s.ctaRow}>
              <Link href="/minifigs" className={s.btnPrimary} aria-label="Shop minifigs now">
                Shop Now
              </Link>
              <Link href="/minifigs?limit=72" className={s.btnSecondary} aria-label="See all items">
                See All Items
              </Link>
            </div>

            <div className={s.linksRow}>
              <Link href="/minifigs" className={s.textLink}>Shop Now</Link>
              <span className={s.dot}>&nbsp;•&nbsp;</span>
              <Link href="/minifigs?limit=72" className={s.textLink}>See All Items</Link>
            </div>
          </div>
        </section>

        {/* Greeting block */}
        <section className={s.gdayBlock}>
          <h2 className={s.gday}>G’day,</h2>
          <p className={s.lead}>
            we strive for 100% customer satisfaction, so please let us know if there’s anything else we can do for you.
          </p>
        </section>
      </main>
    </>
  )
}