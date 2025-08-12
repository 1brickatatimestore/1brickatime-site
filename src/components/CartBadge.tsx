import Link from 'next/link'
import s from './CartBadge.module.css'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  const { totalItems } = useCart()

  return (
    <Link
      href="/checkout"
      aria-label={totalItems > 0 ? `Cart with ${totalItems} items` : 'Cart'}
      title="View cart / Checkout"
      className={s.wrap}
    >
      <svg
        className={s.icon}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 4h-2l-1 2v1h2l3.6 7.59-1.35 2.44A2 2 0 0 0 10 20h8v-2h-7.42a.25.25 0 0 1-.22-.37L11.1 15h5.45a2 2 0 0 0 1.79-1.11L21 8H7.42L7 7V4z"
          fill="currentColor"
        />
      </svg>

      {/* Always render span to avoid hydration mismatches */}
      <span className={s.count} aria-live="polite" data-empty={totalItems === 0 ? '1' : '0'}>
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </Link>
  )
}