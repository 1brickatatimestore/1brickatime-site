import React from 'react'
import { useCart } from '@/context/CartContext'

const CartBadge = () => {
  const { cart } = useCart()
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M6 6h15l-1.5 9h-13z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      {totalQty > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: 12,
          }}
        >
          {totalQty}
        </span>
      )}
    </div>
  )
}

export default CartBadge