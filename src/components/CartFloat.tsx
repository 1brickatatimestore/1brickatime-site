import Link from 'next/link'
import { useMemo } from 'react'
import styles from './CartFloat.module.css'

// Your hook path (same as on minifigs page)
import { useCart as useCartRaw } from '@/context/CartContext'

type CartItem = { id?: string | number; qty?: number }

/** Safely read items from the cart context, regardless of shape or provider presence. */
function useSafeCartItems(): CartItem[] {
  try {
    const ctx = typeof useCartRaw === 'function' ? useCartRaw() : undefined
    // Support both shapes: { state: { items } } and { items }
    const items =
      (ctx as any)?.state?.items ??
      (ctx as any)?.items ??
      []
    return Array.isArray(items) ? items : []
  } catch {
    // If hook throws because we’re outside provider, just render 0
    return []
  }
}

export default function CartFloat() {
  const items = useSafeCartItems()

  const count = useMemo(
    () =>
      Array.isArray(items)
        ? items.reduce((sum, it) => sum + Number(it?.qty ?? 0), 0)
        : 0,
    [items]
  )

  return (
    <Link
      href="/checkout"
      className={styles.badge}
      aria-label={`Checkout, ${count} item${count === 1 ? '' : 's'} in cart`}
    >
      {/* Cart icon */}
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 4h-2l-1 2v2h2l3.6 7.59c.17.33.51.41.74.41h7.66a1 1 0 0 0 .95-.68l2.4-6.32A1 1 0 0 0 21 8H8.31l-.95-2H21" fill="currentColor"/>
        </svg>
      </span>
      <span className={styles.count}>{count}</span>
    </Link>
  )
}