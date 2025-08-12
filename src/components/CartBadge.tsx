import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  // If CartProvider isn’t mounted yet (very first SSR paint), show 0 to avoid hydration mismatch
  let count = 0
  try {
    const { totalItems } = useCart()
    count = totalItems || 0
  } catch {
    count = 0
  }

  return (
    <Link
      href="/checkout"
      aria-label={count > 0 ? `Cart with ${count} items` : 'Cart'}
      title="View cart / Checkout"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 28,
        borderRadius: 6,
        color: '#ffe6a6',
        textDecoration: 'none',
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          fill="currentColor"
          d="M7 4h-2a1 1 0 1 0 0 2h1.2l1.7 8.5A2 2 0 0 0 9.9 16h6.9a1 1 0 0 0 0-2H9.9l-.2-1H17a2 2 0 0 0 1.9-1.5l1.1-4A1 1 0 0 0 19 6H8.2L8 5.1A2 2 0 0 0 7 4Zm2 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        />
      </svg>

      <span
        aria-live="polite"
        data-empty={count === 0 ? '1' : '0'}
        style={{
          position: 'absolute',
          top: -6,
          right: -8,
          minWidth: 16,
          height: 16,
          padding: '0 4px',
          borderRadius: 8,
          background: count === 0 ? 'transparent' : '#ffd24d',
          color: count === 0 ? 'transparent' : '#1a2c34',
          fontSize: 11,
          lineHeight: '16px',
          textAlign: 'center',
          fontWeight: 700,
          boxShadow: count === 0 ? 'none' : '0 1px 0 rgba(0,0,0,.2)',
          transition: 'all .15s ease',
        }}
      >
        {count > 0 ? (count > 99 ? '99+' : count) : 0}
      </span>
    </Link>
  )
}