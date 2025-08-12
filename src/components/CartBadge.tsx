// src/components/CartBadge.tsx
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './CartBadge.module.css'

export default function CartBadge() {
  const { items } = useCart()
  const total = items.reduce((n, i) => n + (i.qty || 0), 0)

  return (
    <Link href="/checkout" className={styles.badge} aria-label={`Cart with ${total} items`} title="View cart / Checkout">
      {/* cart icon */}
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.41A2 2 0 0 0 10 21h9v-2H10l1.1-2h7.45a2 2 0 0 0 1.79-1.11L22 9H7.42l-.75-1.5L6 6h13V4H7z"/>
      </svg>

      {/* always render the bubble to avoid DOM shape mismatch */}
      <span
        className={styles.count}
        data-empty={total === 0 ? '1' : '0'}
        suppressHydrationWarning
      >
        {total > 99 ? '99+' : total}
      </span>
    </Link>
  )
}