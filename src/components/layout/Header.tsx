import Link from 'next/link'
import Logo from '@/components/Logo'
import s from './Header.module.css'

export default function Header() {
  return (
    <header className={s.header}>
      <div className="mainContainer">
        <div className={s.row}>
          <Link href="/" className={s.brand}>
            <Logo width={28} height={28} className={s.brandLogo} />
            <span className={s.brandText}>1 Brick at a Time</span>
          </Link>

          <nav className={s.nav}>
            <Link href="/">Home</Link>
            <Link href="/minifigs">Minifigs</Link>
            <Link href="/minifigs-by-theme">By Theme</Link>
            <Link href="/checkout">Checkout</Link>
          </nav>

          {/* your cart button/badge lives here */}
          <div className={s.rightSlot} />
        </div>
      </div>
    </header>
  )
}