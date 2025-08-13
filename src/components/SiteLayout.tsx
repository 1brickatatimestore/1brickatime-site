import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import s from './SiteLayout.module.css'

const CartFloat = dynamic(() => import('./CartFloat'), { ssr: false })

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* Left stud rail */}
      <div className={s.rail} aria-hidden="true" />

      {/* Header */}
      <header className={s.header}>
        <div className={`${s.headerInner} container`}>
          <Link href="/" className={s.brand}>
            <span className={s.brandLogo} aria-hidden />
            <span className={s.brandName}>1 Brick at a Time</span>
          </Link>

          <nav className={s.nav}>
            <Link href="/">Home</Link>
            <Link href="/minifigs">Minifigs</Link>
            <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
            <Link href="/checkout">Checkout</Link>
          </nav>

          <CartFloat />
        </div>
      </header>

      {/* Main content */}
      <main className={`${s.main} container`}>{children}</main>

      {/* Footer (blue bar w/ CTA) */}
      <footer className={s.footer}>
        <div className={`${s.footerInner} container`}>
          <div className={s.copy}>© 2025 K & K Enterprises · 1 Brick at a Time</div>
          <div className={s.links}>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        <div className={s.ctaBar}>
          <button type="button" className={s.ctaButton} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className={s.sunflower} aria-hidden />
            Build alongside us!
          </button>
        </div>
      </footer>
    </div>
  )
}