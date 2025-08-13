import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.meta}>
          © {year} K & K Enterprises · 1 Brick at a Time
        </div>
        <nav className={styles.links}>
          <Link href="/minifigs">Minifigs</Link>
          <Link href="/minifigs-by-theme">By Theme</Link>
          <Link href="/checkout">Checkout</Link>
        </nav>
      </div>
    </footer>
  )
}