import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './CartFloat.module.css'

function getCount(items: Array<{ qty?: number }>) {
  return (items || []).reduce((n, it) => n + (Number(it.qty || 0)), 0)
}

export default function CartFloat() {
  // safe fallback if context is temporarily undefined
  const ctx = (() => { try { return useCart() } catch { return undefined } })()
  const items = ctx?.state?.items || []
  const count = getCount(items)

  return (
    <Link
      href="/checkout"
      className={`${styles.badge} cart-float`}
      aria-label={`Checkout, ${count} item${count === 1 ? '' : 's'} in cart`}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4h-2l-1 2v2h2l2.3 7.2c.16.5.62.8 1.13.8h7.57a1.2 1.2 0 0 0 1.14-.8L21 8H7.42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className={styles.count} aria-live="polite">{count}</span>
      <span className="sr-only">Open checkout</span>
    </Link>
  )
}