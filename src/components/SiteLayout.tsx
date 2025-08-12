import s from './SiteLayout.module.css'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* Left stud rail (locked) */}
      <div className={s.rail} aria-hidden="true" />

      {/* Header (locked) */}
      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} priority />
            <span>1 Brick at a Time</span>
          </div>
          <div className={s.links}>
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
            <Link href="/minifigs-by-theme">Minifigs by Theme</Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className={s.main}>{children}</main>

      {/* Footer (locked) */}
      <footer className={s.footer}>
        <Image
          src="/footer-banner.png"
          alt="Build alongside us!"
          className={s.footerImg}
          width={2400}
          height={180}
          sizes="100vw"
          priority
        />
      </footer>
    </div>
  )
}