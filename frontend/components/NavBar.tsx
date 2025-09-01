// components/NavBar.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function NavBar() {
  const { pathname } = useRouter()

  return (
    <header className="nav">
      <div className="wrap navInner">
        <Link href="/" className="logo">1 Brick at a Time</Link>
        <nav className="links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link href="/shop" className={pathname === '/shop' ? 'active' : ''}>Shop</Link>
          <Link href="/cart" className={pathname === '/cart' ? 'active' : ''}>Cart</Link>
        </nav>
      </div>
    </header>
  )
}