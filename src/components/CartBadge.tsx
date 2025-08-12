import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './CartBadge.module.css'

export default function CartBadge() {
  const { totalItems } = useCart()

  return (
    <Link href="/checkout" className={styles.cartBadge} aria-label="Cart" title="View cart / Checkout">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A1.99 1.99 0 0 0 10 19h8v-2h-7.42a.25.25 0 0 1-.22-.37l.93-1.63H17a2 2 0 0 0 1.79-1.11l3.58-6.49A1 1 0 0 0 21.5 4H7z" fill="currentColor"/>
      </svg>
      <span className={styles.count} data-empty={totalItems === 0 ? '1' : '0'} aria-live="polite">
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </Link>
  )
}