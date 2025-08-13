import Link from 'next/link'
import s from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className="mainContainer">
        <div className={s.metaRow}>
          <div className={s.brand}>
            © 2025 K &amp; K Enterprises · 1 Brick at a Time
          </div>
          <nav className={s.links}>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>

        {/* sunflower banner inside the footer */}
        <div className={s.bannerWrap}>
          <img
            src="/footer-banner.png"
            alt="Build alongside us!"
            className={s.banner}
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  )
}