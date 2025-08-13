import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import s from './SiteLayout.module.css'
import CartBadge from './CartBadge'

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* Left stud rail (uses your existing CSS for full height) */}
      <div className={s.rail}>
        <Image src="/stud-rail.png" alt="" fill priority className={s.railImg} />
      </div>

      {/* Header: full-width blue bar */}
      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span>1 Brick at a Time</span>
          </div>

          <div className={s.links} style={{ alignItems: 'center' }}>
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
            <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
            <Link href="/checkout">Checkout</Link>
            {/* Cart icon on the far right */}
            <CartBadge />
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className={s.main}>{children}</main>

      {/* Footer: full-width blue bar with your banner image */}
      <footer className={s.footer}>
        <Image
          src="/footer-banner.png"
          alt="Build alongside us!"
          className={s.footerImg}
          width={2400}
          height={180}
          priority
        />
      </footer>
    </div>
  )
}