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
  )
}