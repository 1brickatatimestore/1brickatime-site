import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './Header.module.css'
import { useMemo } from 'react'

export default function Header() {
  const { items } = useCart()
  const count = useMemo(
    () => (items || []).reduce((n, it) => n + (it.qty ?? 0), 0),
    [items]
  )

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        {/* Brand (logo + name) */}
        <Link href="/" className={styles.brand}>
          {/* If you have /public/logo.png it will show; else the emoji fallback keeps layout stable */}
          <img className={styles.logo} src="/logo.png" alt="" onError={(e) => {
            const img = e.currentTarget
            img.style.display = 'none'
          }} />
          <span className={styles.name}>
            <span className={styles.nameStrong}>1 Brick at a Time</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/minifigs">Minifigs</Link>
          <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
          <Link href="/checkout">Checkout</Link>
        </nav>

        {/* Checkout button with crisp badge */}
        <Link href="/checkout" className={styles.checkoutBtn} aria-label="Go to checkout">
          <span className={styles.cartEmoji} aria-hidden>🛒</span>
          <span className={styles.checkoutText}>Checkout</span>
          <span className={styles.badge} aria-live="polite">{count}</span>
        </Link>
      </div>
    </header>
  )
}