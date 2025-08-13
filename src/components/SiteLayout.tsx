import React, { PropsWithChildren } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from './SiteLayout.module.css'

const CartFloat = dynamic(() => import('./CartFloat'), { ssr: false })

export default function SiteLayout({ children }: PropsWithChildren) {
  return (
    <div className={styles.shell}>
      <div className={styles.studs} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLink}>
              <img src="/logo-1brickatime.png" alt="1 Brick at a Time" className={styles.logo} width={40} height={40}/>
              <span className={styles.brandName}>1 Brick at a Time</span>
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/minifigs" className={styles.navLink}>Minifigs</Link>
            <Link href="/minifigs-by-theme" className={styles.navLink}>Minifigs by Theme</Link>
            <Link href="/checkout" className={styles.navLink}>Checkout</Link>
            <CartFloat />
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>© 2025 K &amp; K Enterprises · 1 Brick at a Time</div>
          <div className={styles.footerNav}>
            <Link href="/minifigs" className={styles.footerLink}>Minifigs</Link>
            <Link href="/minifigs-by-theme" className={styles.footerLink}>By Theme</Link>
            <Link href="/checkout" className={styles.footerLink}>Checkout</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}