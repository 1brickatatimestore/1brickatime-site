<<<<<<< HEAD
// src/components/CartBadge.tsx
'use client'

import { useCart } from '@/context/CartContext'

/**
 * CartBadge renders plain inline content (no <a> tag!) so it can safely be
 * placed inside a Next <Link>. This avoids <a><a>…</a></a> hydration errors.
 */
export default function CartBadge() {
  const { totalItems } = useCart()

  return (
    <span
      className="cartBadge"
      aria-label={totalItems > 0 ? `${totalItems} items in cart` : 'Cart is empty'}
    >
      🛒{totalItems > 0 ? ` ${totalItems}` : ''}
      <style jsx>{`
        .cartBadge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }
      `}</style>
    </span>
=======
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  const { totalCount } = useCart()
  return (
    <Link href="/checkout" style={{
      position:'relative',
      padding:'6px 10px',
      border:'2px solid #ffd969',
      borderRadius:8,
      color:'#ffd969',
      fontWeight:700
    }}>
      Cart
      {totalCount > 0 && (
        <span style={{
          position:'absolute', top:-8, right:-8,
          minWidth:22, height:22, borderRadius:11,
          display:'grid', placeItems:'center',
          background:'#ffd969', color:'#1f5376',
          fontSize:12, fontWeight:800, padding:'0 6px'
        }}>
          {totalCount}
        </span>
      )}
    </Link>
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
  )
}