import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import s from './CartFloat.module.css'

function useSafeCartCount(){
  try {
    const { state } = useCart()
    return (state?.items || []).reduce((n: number, it: any) => n + (Number(it.qty)||0), 0)
  } catch {
    return 0
  }
}

export default function CartFloat(){
  const count = useSafeCartCount()
  return (
    <Link href="/checkout"
      aria-label={`Checkout, ${count} item${count===1?'':'s'} in cart`}
      className={s.badge}
    >
      <svg className={s.icon} viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4h-2l-1 2v2h2l3.6 7.59c.16.33.5.54.87.54h7.53a1 1 0 0 0 .95-.68l2.28-6.83A1 1 0 0 0 21.1 7H8.21L7.27 4.9A1 1 0 0 0 7 4zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
      </svg>
      <span className={s.count} aria-live="polite">{count}</span>
      <span className={s.label}>Checkout</span>
    </Link>
  )
}