import s from './SiteLayout.module.css'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

type Props = { children: ReactNode }

export default function SiteLayout({ children }: Props) {
  // Show total MINIFIG count next to “Minifigs by Theme”
  const [minifigCount, setMinifigCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    // Your /api/minifigs already returns { count, inventory: [] }
    fetch('/api/minifigs?type=MINIFIG&limit=0')
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(j => {
        if (alive && typeof j?.count === 'number') setMinifigCount(j.count)
      })
      .catch(() => { /* ignore */ })
    return () => { alive = false }
  }, [])

  return (
    <div className={s.shell}>
      {/* Left stud rail (LOCKED) */}
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
              Minifigs by Theme{minifigCount != null ? ` (${minifigCount})` : ''}
            </Link>
          </div>
        </nav>
      </header>

      {/* Page content (LOCKED) */}
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