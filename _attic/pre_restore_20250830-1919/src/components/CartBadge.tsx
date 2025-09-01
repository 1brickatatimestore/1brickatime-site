<<<<<<< HEAD:src/components/CartBadge.tsx
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
=======
import Link from "next/link";
import s from "./CartBadge.module.css";
import { useCart } from "@/context/CartContext";

export default function CartBadge() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/checkout"
      aria-label={totalItems > 0 ? `Cart with ${totalItems} items` : "Cart"}
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
      <span
        className={s.count}
        aria-live="polite"
        data-empty={totalItems === 0 ? "1" : "0"}
      >
        {totalItems > 99 ? "99+" : totalItems}
      </span>
    </Link>
  );
}
>>>>>>> ed05686 (Stable backup - September 1st, 2025):_attic/pre_restore_20250830-1919/src/components/CartBadge.tsx
