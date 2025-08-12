import s from './SiteLayout.module.css'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// avoid SSR mismatch for localStorage-backed count
const CartBadge = dynamic(() => import('./CartBadge'), { ssr: false })

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* Left stud rail (locked) */}
      <div className={s.rail}>
        <Image src="/stud-rail.png" alt="" fill priority className={s.railImg} />
      </div>

      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span>1 Brick at a Time</span>
          </div>
          <div className={s.links}>
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
            <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
            <CartBadge />
          </div>
        </nav>
      </header>

      <main className={s.main}>{children}</main>

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