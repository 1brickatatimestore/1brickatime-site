import Link from 'next/link'
import Image from 'next/image'
import s from './SiteLayout.module.css'

export default function Header() {
  return (
    <header className={s.header}>
      <Link href="/" className={s.brand}>
        <Image
          src="/logo.png"
          alt="1 Brick at a Time"
          width={28}
          height={28}
          priority
        />
        <span>1 Brick at a Time</span>
      </Link>

      <nav className={s.nav}>
        <Link href="/">Home</Link>
        <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
      </nav>
    </header>
  )
}