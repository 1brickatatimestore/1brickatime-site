import React, { ReactNode } from 'react'
import CartBadge from './CartBadge'

interface LayoutProps {
  children: ReactNode
}

const SiteLayout = ({ children }: LayoutProps) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '64px', background: '#1f5376' }}>Rail</aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#204d69', padding: '16px', color: '#fff' }}>
          <h1>1 Brick at a Time</h1>
          <CartBadge />
        </header>
        <main style={{ flex: 1, padding: '16px' }}>{children}</main>
        <footer style={{ background: '#204d69', padding: '16px', color: '#fff', textAlign: 'center' }}>
          © 2025 1 Brick at a Time
        </footer>
      </div>
    </div>
  )
}

export default SiteLayout