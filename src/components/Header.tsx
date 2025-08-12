// src/components/Header.tsx
import Link from 'next/link';
import styles from './SiteLayout.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span role="img" aria-label="stud">🧱</span>
          <span>1 Brick at a Time</span>
        </div>
        <div className={styles.links}>
          <Link href="/">Home</Link>
          <Link href="/minifigs">Minifigs</Link>
          <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
          <Link href="/checkout"><b>Checkout</b></Link>
        </div>
      </nav>
    </header>
  );
}