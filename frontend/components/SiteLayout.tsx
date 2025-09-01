// components/SiteLayout.tsx
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from '../styles/Layout.module.css'

export default function SiteLayout({ children }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>1 Brick at a Time</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className={styles.title}>1 Brick at a Time</span>
        </div>
        <nav>
          <Link href="/" legacyBehavior><a>Home</a></Link>
          <Link href="/minifigures" legacyBehavior><a>Minifigures</a></Link>
          <Link href="/checkout" legacyBehavior><a>Checkout</a></Link>
        </nav>
      </header>

      <div className={styles.mainWrapper}>
        <div className={styles.studbar}>
          <Image src="/studbar-vertical.png" alt="Studbar" layout="fill" objectFit="cover" />
        </div>

        <main className={styles.mainContent}>{children}</main>
      </div>

      <footer className={styles.footer}>
        <Image
          src="/footer-banner.png"
          alt="Build alongside us!"
          className={styles.footerBanner}
          width={700}
          height={100}
        />
      </footer>
    </div>
  )
}