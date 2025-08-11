import s from './SiteLayout.module.css'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  return (
    <div className={s.shell}>
      {/* LEFT STUD RAIL — fixed, behind everything */}
      <div className={s.rail} />

      {/* HEADER (locked) */}
      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span>1 Brick at a Time</span>
          </div>
          <div className={s.links}>
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
          </div>
        </nav>
      </header>

      {/* PAGE CONTENT */}
      <main className={s.main}>{children}</main>

      {/* FOOTER (locked) */}
      <footer className={s.footer}>
        <Image
          src="/footer-banner.png"
          alt="Build alongside us!"
          className={s.footerImg}
          width={1200}
          height={160}
          priority
        />
      </footer>
    </div>
  )
}