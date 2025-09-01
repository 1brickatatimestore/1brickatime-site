// components/Header.tsx
import Image from 'next/image'
import Link from 'next/link'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Image src="/favicon.png" alt="Logo" width={32} height={32} />
        <span className={styles.logoText}>1 Brick at a Time</span>
      </div>
      <nav className={styles.nav}>
        <Link href="/">Home</Link>
        <Link href="/minifigures">Minifigures</Link>
        <Link href="/checkout">Checkout</Link>
      </nav>
    </header>
  )
}