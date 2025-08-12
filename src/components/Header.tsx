import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const CartBadge = dynamic(() => import('./CartBadge'), { ssr: false })

export default function Header() {
  return (
    <header
      style={{
        marginLeft: 'var(--rail-w, 64px)',
        background: '#1f5376',
        color: '#fff',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 700 }}>
          <Image src="/logo.png" alt="1 Brick at a Time" width={28} height={28} />
          <Link href="/" style={{ color: '#ffd969' }}>
            1 Brick at a Time
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/minifigs?type=MINIFIG&limit=36" style={{ color: '#ffd969' }}>
            Minifigs
          </Link>
          <Link href="/minifigs-by-theme" style={{ color: '#ffd969' }}>
            Minifigs by Theme
          </Link>
          <Link href="/checkout" style={{ color: '#ffd969' }}>
            Checkout
          </Link>
          <div style={{ marginLeft: 12 }}>
            <CartBadge />
          </div>
        </div>
      </nav>
    </header>
  )
}