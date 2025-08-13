import Link from 'next/link'
import type { ReactNode } from 'react'
import s from './SiteLayout.module.css'

// Do NOT change: this keeps whatever cart pill you liked.
// It simply renders whatever your current CartFloat/CartBadge shows.
let CartBadge: any = null
try {
  // If you still have CartFloat only, this shim will resolve through CartBadge.tsx
  // (export { default } from './CartFloat' )
  // or directly to CartFloat if you import it here.
  // We keep dynamic import out to avoid SSR mismatch warnings.
  CartBadge = require('./CartBadge').default || null
} catch (_) {
  try { CartBadge = require('./CartFloat').default || null } catch (_e) {}
}

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.page}>
      {/* Left studs rail */}
      <aside className={s.studs} aria-hidden="true" />

      {/* Header */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={s.brand}>
            {/* small round logo + name exactly like your screenshot */}
            <img src="/logo-1brickatime.png" alt="1 Brick at a Time" className={s.brandLogo} />
            <span className={s.brandText}>1 Brick at a Time</span>
          </Link>

          <nav className={s.nav}>
            <Link href="/" className={s.navLink}>Home</Link>
            <Link href="/minifigs" className={s.navLink}>Minifigs</Link>
            <Link href="/minifigs-by-theme" className={s.navLink}>By Theme</Link>
            <Link href="/checkout" className={s.navLink}>Checkout</Link>
          </nav>

          <div className={s.cartSpot}>
            {/* Keep your current trolley untouched */}
            {CartBadge ? <CartBadge /> : null}
          </div>
        </div>
      </header>

      {/* Main cream content area */}
      <main className={s.main}>
        <div className={s.container}>
          {children}
        </div>
      </main>

      {/* Footer with teal bar and sunflower banner centered inside */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <img
            src="/footer-banner.png"
            alt="Build alongside us!"
            className={s.footerBanner}
            decoding="async"
          />
        </div>
      </footer>
    </div>
  )
}