// src/components/Layout.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import s from './SiteLayout.module.css'
import CartBadge from './CartBadge'

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* Left stud rail */}
      <div className={s.rail}>
        <Image src="/stud-rail.png" alt="" fill priority className={s.railImg} />
      </div>

      {/* Header */}
      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span>1 Brick at a Time</span>
          </div>

          <div className={s.links} style={{ alignItems: 'center' }}>
            <Link href="/">Home</Link>
            <Link href="/minifigs-by-theme">Minifigures</Link>
            {/* If you want to keep a Themes link, point it to /minifigs (the redirect also works) */}
            {/* <Link href="/minifigs-by-theme">Minifigures</Link> */}
            <Link href="/checkout">Checkout</Link>
            <Link href="/cart"><CartBadge /></Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className={s.main}>{children}</main>

      {/* Footer */}
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