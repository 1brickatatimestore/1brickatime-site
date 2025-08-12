// src/components/SiteLayout.tsx
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import s from './SiteLayout.module.css'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const [miniCount, setMiniCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/minifigs?type=MINIFIG&limit=1')
      .then(r => r.json())
      .then(d => { if (alive) setMiniCount(typeof d.count === 'number' ? d.count : null) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return (
    <div className={s.shell}>
      {/* Left stud rail: single image, full height */}
      <div className={s.rail}>
        <Image
          src="/stud-rail.png"
          alt=""
          fill
          priority
          className={s.railImg}
        />
      </div>

      {/* Header (LOCKED) */}
      <header className={s.header}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span>1 Brick at a Time</span>
          </div>
          <div className={s.links}>
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
            <Link href="/minifigs-by-theme">
              {`Minifigs by Theme${miniCount !== null ? ` (${miniCount})` : ''}`}
            </Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className={s.main}>{children}</main>

      {/* Footer (LOCKED) */}
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